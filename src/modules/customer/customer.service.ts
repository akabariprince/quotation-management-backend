// src/modules/customer/customer.service.ts
import { Op } from 'sequelize';
import Customer from '../../models/Customer.model';
import User from '../../models/User.model';
import OTPLog from '../../models/OTPLog.model';
import { ApiError } from '../../utils/ApiError';
import { AuthUser } from '../../types/express';
import { canManageAllCustomers } from '../../utils/ownership.utils';
import {
  parsePagination,
  buildPaginationMeta,
} from '../../utils/pagination.utils';
import { generateOTP, hashOTP, isOTPExpired, verifyOTP } from '../../utils/otp.utils';
import { env } from '../../config/environment';
import { notificationService } from '../../services/notification.service';
import { NOTIFICATION_TYPES } from '../../services/notification.constants';
import { sendOTPEmail } from '../../services/email.service';

class CustomerService {
  private normalizeEmail(email?: string | null) {
    return email ? email.trim().toLowerCase() : null;
  }

  private normalizeMobile(mobile: string) {
    let normalized = mobile.trim().replace(/\s+/g, "");
    if (!normalized.startsWith("+")) {
      const digits = normalized.replace(/\D/g, "");
      if (digits.length === 10) normalized = `+91${digits}`;
      else normalized = `+${digits}`;
    }
    return normalized;
  }

  private async assertUniqueCustomerFields(
    input: {
      mobile?: string | null;
      email?: string | null;
    },
    excludeCustomerId?: string,
  ) {
    const checks: Array<Promise<void>> = [];

    if (input.mobile) {
      const normalizedMobile = this.normalizeMobile(input.mobile);
      checks.push(
        (async () => {
          const existingCustomer = await Customer.findOne({
            where: {
              mobile: normalizedMobile,
              ...(excludeCustomerId ? { id: { [Op.ne]: excludeCustomerId } } : {}),
            },
          });

          if (!existingCustomer) return;

          throw ApiError.conflict("Mobile number already exists");
        })(),
      );
    }

    if (input.email) {
      const normalizedEmail = this.normalizeEmail(input.email);
      checks.push(
        (async () => {
          const existingCustomer = await Customer.findOne({
            where: {
              email: { [Op.iLike]: normalizedEmail as string },
              ...(excludeCustomerId ? { id: { [Op.ne]: excludeCustomerId } } : {}),
            },
          });

          if (!existingCustomer) return;

          throw ApiError.conflict("Email already exists");
        })(),
      );
    }

    await Promise.all(checks);
  }

  private async consumeVerification(
    mobile: string,
    verificationOtpLogId?: string | null,
  ) {
    if (!verificationOtpLogId) {
      return {
        whatsappVerified: false,
        whatsappVerifiedAt: null,
        whatsappVerifiedMobile: null,
      };
    }

    const otpLog = await OTPLog.findOne({
      where: {
        id: verificationOtpLogId,
        email: mobile,
        type: "customer_mobile_verification",
        status: "approved",
      },
    });

    if (!otpLog) {
      return {
        whatsappVerified: false,
        whatsappVerifiedAt: null,
        whatsappVerifiedMobile: null,
      };
    }

    return {
      whatsappVerified: true,
      whatsappVerifiedAt: otpLog.approvedAt || new Date(),
      whatsappVerifiedMobile: mobile,
    };
  }

  private async consumeEmailVerification(
    email?: string | null,
    verificationOtpLogId?: string | null,
  ) {
    if (!email || !verificationOtpLogId) {
      return {
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerifiedEmail: null,
      };
    }

    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return {
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerifiedEmail: null,
      };
    }
    const otpLog = await OTPLog.findOne({
      where: {
        id: verificationOtpLogId,
        email: normalizedEmail,
        type: "customer_email_verification",
        status: "approved",
      },
    });

    if (!otpLog) {
      return {
        emailVerified: false,
        emailVerifiedAt: null,
        emailVerifiedEmail: null,
      };
    }

    return {
      emailVerified: true,
      emailVerifiedAt: otpLog.approvedAt || new Date(),
      emailVerifiedEmail: normalizedEmail,
    };
  }

  /* ─────────────────── LIST ─────────────────── */
  async findAll(query: any, authUser: AuthUser) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'name', 'city', 'state',
    ]);

    const where: any = {};

    // ═══════════════════════════════════════════════════════
    //  NO ownership filter here — ALL users see ALL customers
    //  Ownership is only enforced on edit / delete
    // ═══════════════════════════════════════════════════════

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { mobile: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { city: { [Op.iLike]: `%${query.search}%` } },
        { gstin: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.city) where.city = { [Op.iLike]: `%${query.city}%` };
    if (query.state) where.state = { [Op.iLike]: `%${query.state}%` };
    if (query.region) where.region = query.region;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  /* ─────────────────── GET BY ID ─────────────────── */
  async findById(id: string, _authUser?: AuthUser) {
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    if (!customer) throw ApiError.notFound('Customer not found');

    // ══ No ownership check on VIEW — everyone can see any customer ══

    return customer;
  }

  /* ─────────────────── CREATE ─────────────────── */
  async create(data: any, authUser: AuthUser) {
    const normalizedMobile = this.normalizeMobile(data.mobile);
    const normalizedEmail = this.normalizeEmail(data.email);
    await this.assertUniqueCustomerFields({
      mobile: normalizedMobile,
      email: normalizedEmail,
    });
    const verification = await this.consumeVerification(
      normalizedMobile,
      data.verificationOtpLogId,
    );
    const emailVerification = await this.consumeEmailVerification(
      normalizedEmail,
      data.emailVerificationOtpLogId,
    );
    const createData = { ...data };
    delete createData.verificationOtpLogId;
    delete createData.emailVerificationOtpLogId;
    return Customer.create({
      ...createData,
      mobile: normalizedMobile,
      email: normalizedEmail,
      ...verification,
      ...emailVerification,
      createdBy: authUser.id,
    });
  }

  /* ─────────────────── UPDATE ─────────────────── */
  async update(id: string, data: any, authUser: AuthUser) {
    const customer = await this.findById(id);
    this.assertOwnership(customer, authUser, 'edit');
    const updateData = { ...data };

    if (updateData.email !== undefined) {
      updateData.email = this.normalizeEmail(updateData.email);

      if (updateData.email !== customer.email) {
        const emailVerification = await this.consumeEmailVerification(
          updateData.email,
          updateData.emailVerificationOtpLogId,
        );
        Object.assign(updateData, emailVerification);
      } else if (updateData.emailVerificationOtpLogId) {
        const emailVerification = await this.consumeEmailVerification(
          updateData.email,
          updateData.emailVerificationOtpLogId,
        );
        Object.assign(updateData, emailVerification);
      } else {
        delete updateData.emailVerificationOtpLogId;
      }
    }

    if (updateData.mobile !== undefined) {
      const normalizedMobile = this.normalizeMobile(updateData.mobile);
      updateData.mobile = normalizedMobile;

      if (normalizedMobile !== customer.mobile) {
        const verification = await this.consumeVerification(
          normalizedMobile,
          updateData.verificationOtpLogId,
        );
        Object.assign(updateData, verification);
      } else if (updateData.verificationOtpLogId) {
        const verification = await this.consumeVerification(
          normalizedMobile,
          updateData.verificationOtpLogId,
        );
        Object.assign(updateData, verification);
      } else {
        delete updateData.verificationOtpLogId;
      }
    }

    if (!('mobile' in updateData) && updateData.verificationOtpLogId) {
      const verification = await this.consumeVerification(
        customer.mobile,
        updateData.verificationOtpLogId,
      );
      Object.assign(updateData, verification);
    }

    if (!('email' in updateData) && updateData.emailVerificationOtpLogId) {
      const emailVerification = await this.consumeEmailVerification(
        customer.email,
        updateData.emailVerificationOtpLogId,
      );
      Object.assign(updateData, emailVerification);
    }

    await this.assertUniqueCustomerFields(
      {
        mobile: updateData.mobile !== undefined ? updateData.mobile : customer.mobile,
        email: updateData.email !== undefined ? updateData.email : customer.email,
      },
      id,
    );

    delete updateData.verificationOtpLogId;
    delete updateData.emailVerificationOtpLogId;
    await customer.update(updateData);
    return customer;
  }

  /* ─────────────────── DELETE ─────────────────── */
  async delete(id: string, authUser: AuthUser) {
    const customer = await this.findById(id);
    this.assertOwnership(customer, authUser, 'delete');
    await customer.destroy();
  }

  /* ─────── private: ownership guard (edit/delete only) ─────── */
  private assertOwnership(customer: Customer, authUser: AuthUser, action: string) {
    if (canManageAllCustomers(authUser)) return;          // has customer:manage_all
    if (customer.createdBy === authUser.id) return;       // is the owner

    throw ApiError.forbidden(
      `You can only ${action} customers you created`,
    );
  }

  async requestMobileOTP(mobile: string, authUser: AuthUser) {
    const normalizedMobile = this.normalizeMobile(mobile);

    await OTPLog.update(
      { status: "expired" },
      {
        where: {
          email: normalizedMobile,
          type: "customer_mobile_verification",
          status: "pending",
        },
      },
    );

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + env.otp.expiryMinutes * 60 * 1000,
    );

    const otpLog = await OTPLog.create({
      type: "customer_mobile_verification",
      entityType: "customer",
      email: normalizedMobile,
      otpHash,
      requestedBy: authUser.id,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    await notificationService.dispatchWhatsApp({
      notificationType: NOTIFICATION_TYPES.customerOtpVerification,
      recipient: normalizedMobile,
      subject: "Customer mobile verification OTP",
      toPhone: normalizedMobile,
      templateParameters: [otp],
      referenceId: otpLog.id,
      referenceType: "otp_log",
      sentBy: authUser.id,
      requestPayload: { mobile: normalizedMobile },
    });

    return {
      otpLogId: otpLog.id,
      expiresAt,
      mobile: normalizedMobile,
    };
  }

  async verifyMobileOTP(mobile: string, otp: string, otpLogId: string) {
    const normalizedMobile = this.normalizeMobile(mobile);
    const otpLog = await OTPLog.findOne({
      where: {
        id: otpLogId,
        email: normalizedMobile,
        type: "customer_mobile_verification",
        status: "pending",
      },
    });

    if (!otpLog) throw ApiError.badRequest("Invalid OTP request");

    if (isOTPExpired(otpLog.createdAt, env.otp.expiryMinutes)) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("OTP has expired");
    }

    if (otpLog.maxAttempts > 0 && otpLog.attempts >= otpLog.maxAttempts) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("Maximum OTP attempts exceeded");
    }

    const isValid = await verifyOTP(otp, otpLog.otpHash);
    if (!isValid) {
      await otpLog.update({ attempts: otpLog.attempts + 1 });
      throw ApiError.badRequest("Invalid OTP");
    }

    await otpLog.update({
      status: "approved",
      approvedAt: new Date(),
    });

    return {
      success: true,
      otpLogId: otpLog.id,
      verifiedMobile: normalizedMobile,
      verifiedAt: otpLog.approvedAt,
    };
  }

  async requestEmailOTP(email: string, authUser: AuthUser) {
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail) {
      throw ApiError.badRequest("Valid email is required");
    }

    await OTPLog.update(
      { status: "expired" },
      {
        where: {
          email: normalizedEmail,
          type: "customer_email_verification",
          status: "pending",
        },
      },
    );

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + env.otp.expiryMinutes * 60 * 1000,
    );

    const otpLog = await OTPLog.create({
      type: "customer_email_verification",
      entityType: "customer",
      email: normalizedEmail,
      otpHash,
      requestedBy: authUser.id,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    const sent = await sendOTPEmail(
      normalizedEmail,
      otp,
      "customer email verification",
      {
        description: "Use this OTP to verify the customer email address in ESIPL.",
      },
    );

    if (!sent) {
      throw ApiError.internal("Failed to send email OTP");
    }

    return {
      otpLogId: otpLog.id,
      expiresAt,
      email: normalizedEmail,
    };
  }

  async verifyEmailOTP(email: string, otp: string, otpLogId: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw ApiError.badRequest("Valid email is required");
    }
    const otpLog = await OTPLog.findOne({
      where: {
        id: otpLogId,
        email: normalizedEmail,
        type: "customer_email_verification",
        status: "pending",
      },
    });

    if (!otpLog) throw ApiError.badRequest("Invalid OTP request");

    if (isOTPExpired(otpLog.createdAt, env.otp.expiryMinutes)) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("OTP has expired");
    }

    if (otpLog.maxAttempts > 0 && otpLog.attempts >= otpLog.maxAttempts) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("Maximum OTP attempts exceeded");
    }

    const isValid = await verifyOTP(otp, otpLog.otpHash);
    if (!isValid) {
      await otpLog.update({ attempts: otpLog.attempts + 1 });
      throw ApiError.badRequest("Invalid OTP");
    }

    await otpLog.update({
      status: "approved",
      approvedAt: new Date(),
    });

    return {
      success: true,
      otpLogId: otpLog.id,
      verifiedEmail: normalizedEmail,
      verifiedAt: otpLog.approvedAt,
    };
  }
}

export const customerService = new CustomerService();
