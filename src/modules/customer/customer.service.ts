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

class CustomerService {
  private normalizeMobile(mobile: string) {
    let normalized = mobile.trim().replace(/\s+/g, "");
    if (!normalized.startsWith("+")) {
      const digits = normalized.replace(/\D/g, "");
      if (digits.length === 10) normalized = `+91${digits}`;
      else normalized = `+${digits}`;
    }
    return normalized;
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
    const verification = await this.consumeVerification(
      normalizedMobile,
      data.verificationOtpLogId,
    );
    const createData = { ...data };
    delete createData.verificationOtpLogId;
    return Customer.create({
      ...createData,
      mobile: normalizedMobile,
      ...verification,
      createdBy: authUser.id,
    });
  }

  /* ─────────────────── UPDATE ─────────────────── */
  async update(id: string, data: any, authUser: AuthUser) {
    const customer = await this.findById(id);
    this.assertOwnership(customer, authUser, 'edit');
    const updateData = { ...data };

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

    delete updateData.verificationOtpLogId;
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
}

export const customerService = new CustomerService();
