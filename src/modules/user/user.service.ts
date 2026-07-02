// src/modules/user/user.service.ts
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import User from '../../models/User.model';
import Role from '../../models/Role.model';
import OTPLog from '../../models/OTPLog.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { env } from '../../config/environment';
import { generateOTP, hashOTP, isOTPExpired, verifyOTP } from '../../utils/otp.utils';
import { notificationService } from '../../services/notification.service';
import { NOTIFICATION_TYPES } from '../../services/notification.constants';

class UserService {
  private normalizeEmail(email?: string | null) {
    return email ? email.trim().toLowerCase() : null;
  }

  private normalizeMobile(mobile: string) {
    let normalized = mobile.trim().replace(/\s+/g, "");
    if (!normalized.startsWith("+")) {
      const digits = normalized.replace(/\D/g, "");
      normalized = digits.length === 10 ? `+91${digits}` : `+${digits}`;
    }
    return normalized;
  }

  private async assertUniqueUserFields(
    input: {
      email?: string | null;
      mobile?: string | null;
    },
    excludeUserId?: string,
  ) {
    const checks: Array<Promise<void>> = [];

    if (input.email) {
      const normalizedEmail = this.normalizeEmail(input.email);
      checks.push(
        (async () => {
          const existingUser = await User.findOne({
            where: {
              email: { [Op.iLike]: normalizedEmail as string },
              ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
            },
            paranoid: false,
          });

          if (!existingUser) return;

          if (existingUser.deletedAt) {
            throw ApiError.conflict(
              "Email is already linked to a deleted user. Please use a different email.",
            );
          }

          throw ApiError.conflict("Email already exists");
        })(),
      );
    }

    if (input.mobile) {
      const normalizedMobile = this.normalizeMobile(input.mobile);
      checks.push(
        (async () => {
          const existingUser = await User.findOne({
            where: {
              mobile: normalizedMobile,
              ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
            },
            paranoid: false,
          });

          if (!existingUser) return;

          if (existingUser.deletedAt) {
            throw ApiError.conflict(
              "Mobile number is already linked to a deleted user. Please use a different mobile number.",
            );
          }

          throw ApiError.conflict("Mobile number already exists");
        })(),
      );
    }

    await Promise.all(checks);
  }

  private async consumeVerification(
    mobile?: string | null,
    verificationOtpLogId?: string | null,
  ) {
    if (!mobile || !verificationOtpLogId) {
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
        type: "user_mobile_verification",
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

  async findAll(query: any) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'name', 'email',
    ]);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.roleId) where.roleId = query.roleId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] },
      ],
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  async getSalesPersons() {
    return User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'mobile', 'whatsappVerified', 'whatsappVerifiedAt', 'whatsappVerifiedMobile'],
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName', 'permissions'] },
      ],
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async create(data: any) {
    delete data.whatsappVerified;
    delete data.whatsappVerifiedAt;
    delete data.whatsappVerifiedMobile;
    data.email = this.normalizeEmail(data.email);
    await this.assertUniqueUserFields({
      email: data.email,
      mobile: data.mobile || null,
    });

    const role = await Role.findByPk(data.roleId);
    if (!role) throw ApiError.badRequest('Invalid role ID');

    const normalizedMobile = data.mobile ? this.normalizeMobile(data.mobile) : null;
    const verification = await this.consumeVerification(
      normalizedMobile,
      data.verificationOtpLogId,
    );
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const createData = { ...data, password: hashedPassword, mobile: normalizedMobile };
    delete createData.verificationOtpLogId;
    const user = await User.create({ ...createData, ...verification });

    return this.findById(user.id);
  }

  async update(id: string, data: any) {
    delete data.whatsappVerified;
    delete data.whatsappVerifiedAt;
    delete data.whatsappVerifiedMobile;
    const user = await User.findByPk(id);
    if (!user) throw ApiError.notFound('User not found');

    if (data.email !== undefined) {
      data.email = this.normalizeEmail(data.email);
    }

    if (data.roleId) {
      const role = await Role.findByPk(data.roleId);
      if (!role) throw ApiError.badRequest('Invalid role ID');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    if (data.mobile !== undefined) {
      const normalizedMobile = data.mobile ? this.normalizeMobile(data.mobile) : null;
      data.mobile = normalizedMobile;

      if (normalizedMobile !== user.mobile) {
        Object.assign(
          data,
          await this.consumeVerification(normalizedMobile, data.verificationOtpLogId),
        );
      } else {
        delete data.verificationOtpLogId;
      }
    }

    if (!("mobile" in data) && data.verificationOtpLogId && user.mobile) {
      Object.assign(
        data,
        await this.consumeVerification(user.mobile, data.verificationOtpLogId),
      );
    }

    await this.assertUniqueUserFields(
      {
        email: data.email !== undefined ? data.email : user.email,
        mobile: data.mobile !== undefined ? data.mobile : user.mobile,
      },
      id,
    );

    delete data.verificationOtpLogId;

    await user.update(data);
    return this.findById(id);
  }

  async delete(id: string, deletedBy?: string) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) throw ApiError.notFound('User not found');

    // Prevent deleting the current user
    if (deletedBy && deletedBy === id) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    // Prevent deleting the last admin user
    if (user.role?.name === 'admin') {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const adminCount = await User.count({ where: { roleId: adminRole.id } });
        if (adminCount <= 1) {
          throw ApiError.badRequest(
            'This is the last active admin account. Please create another admin before deleting this user.'
          );
        }
      }
    }

    await user.destroy();
  }

  async requestMobileOTP(mobile: string, requestedBy?: string) {
    const normalizedMobile = this.normalizeMobile(mobile);

    await OTPLog.update(
      { status: "expired" },
      {
        where: {
          email: normalizedMobile,
          type: "user_mobile_verification",
          status: "pending",
        },
      },
    );

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

    const otpLog = await OTPLog.create({
      type: "user_mobile_verification",
      entityType: "user",
      email: normalizedMobile,
      otpHash,
      requestedBy: requestedBy || null,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    await notificationService.dispatchWhatsApp({
      notificationType: NOTIFICATION_TYPES.userOtpVerification,
      recipient: normalizedMobile,
      subject: "User mobile verification OTP",
      toPhone: normalizedMobile,
      templateParameters: [otp],
      referenceId: otpLog.id,
      referenceType: "otp_log",
      sentBy: requestedBy || null,
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
        type: "user_mobile_verification",
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

export const userService = new UserService();
