// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import { User, Role, OTPLog, EmailLog } from "../../models";
import { ApiError } from "../../utils/ApiError";
import {
  generateTokens,
  verifyRefreshToken,
  TokenPayload,
} from "../../utils/jwt.utils";
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  isOTPExpired,
} from "../../utils/otp.utils";
import { sendOTPEmail } from "../../utils/email.service";
import { env } from "../../config/environment";
import { Op } from "sequelize";
import { logger } from "../../utils/logger";

export class AuthService {
  private buildTokenPayload(user: any): TokenPayload {
    return {
      userId: user.id,
      email: user.email,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions: user.role.permissions || [],
    };
  }

  private buildUserResponse(user: any) {
    return {
      ...user.toSafeJSON(),
      role: {
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.displayName,
        permissions: user.role.permissions,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({
      where: { email, isActive: true },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (!user.role || !user.role.isActive) {
      throw ApiError.forbidden("Your role is inactive. Contact admin.");
    }

    const payload = this.buildTokenPayload(user);
    const tokens = generateTokens(payload);

    await user.update({
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    });

    return {
      user: this.buildUserResponse(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findOne({
        where: { id: decoded.userId, refreshToken, isActive: true },
        include: [{ model: Role, as: "role" }],
      });

      if (!user || !user.role) {
        throw ApiError.unauthorized("Invalid refresh token");
      }

      const payload = this.buildTokenPayload(user);
      const tokens = generateTokens(payload);
      await user.update({ refreshToken: tokens.refreshToken });

      return {
        user: this.buildUserResponse(user),
        ...tokens,
      };
    } catch (error: any) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }
  }

  async logout(userId: string) {
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }

  async requestOTP(
    email: string,
    type: "login" | "discount" | "master_activation",
    requestedBy?: string,
    entityId?: string,
    entityType?: string,
  ) {
    const recentOTP = await OTPLog.findOne({
      where: {
        email,
        type,
        createdAt: {
          [Op.gte]: new Date(Date.now() - env.otp.resendCooldownSeconds * 1000),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (recentOTP) {
      throw ApiError.tooManyRequests(
        `Please wait ${env.otp.resendCooldownSeconds} seconds before requesting a new OTP`,
      );
    }

    const recentAttempts = await OTPLog.count({
      where: {
        email,
        type,
        createdAt: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentAttempts >= env.otp.maxResend) {
      throw ApiError.tooManyRequests(
        "Maximum OTP requests reached. Try again later.",
      );
    }

    await OTPLog.update(
      { status: "expired" },
      { where: { email, type, status: "pending" } },
    );

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

    const otpLog = await OTPLog.create({
      type,
      entityId: entityId || null,
      entityType: entityType || null,
      email,
      otpHash,
      requestedBy: requestedBy || null,
      status: "pending",
      expiresAt,
    });

    const emailSent = await sendOTPEmail(email, otp, type.replace("_", " "));

    await EmailLog.create({
      toEmail: email,
      subject: `OTP for ${type}`,
      type: "otp",
      referenceId: otpLog.id,
      referenceType: "otp_log",
      status: emailSent ? "sent" : "failed",
      sentBy: requestedBy || null,
    });

    if (!emailSent) {
      logger.warn(`Failed to send OTP email to ${email}`);
    }

    return { otpLogId: otpLog.id, message: "OTP sent successfully", expiresAt };
  }

  async verifyOTPCode(email: string, otp: string, otpLogId: string) {
    const otpLog = await OTPLog.findOne({
      where: { id: otpLogId, email, status: "pending" },
    });

    if (!otpLog) throw ApiError.badRequest("Invalid OTP request");

    if (isOTPExpired(otpLog.createdAt, env.otp.expiryMinutes)) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("OTP has expired");
    }

    if (otpLog.attempts >= otpLog.maxAttempts) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("Maximum OTP attempts exceeded");
    }

    const isValid = await verifyOTP(otp, otpLog.otpHash);
    if (!isValid) {
      await otpLog.update({ attempts: otpLog.attempts + 1 });
      throw ApiError.badRequest("Invalid OTP");
    }

    await otpLog.update({ status: "approved", approvedAt: new Date() });
    return { success: true, otpLog: otpLog.toJSON() };
  }

  async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "displayName", "permissions"],
        },
      ],
    });

    if (!user) throw ApiError.notFound("User not found");

    return this.buildUserResponse(user);
  }

  async getLoginUsers() {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "email"],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "displayName"],
          where: { isActive: true },
        },
      ],
      order: [["name", "ASC"]],
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.displayName,
      },
    }));
  }
}

export const authService = new AuthService();
