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
import { sendOTPEmail, sendLoginNotificationEmail } from "../../services/email.service";
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
        discountMin: Number(user.role.discountMin) || 0,
        discountMax: Number(user.role.discountMax) || 100,
        requireOtpForMaster: user.role.requireOtpForMaster ?? true,
      },
    };
  }

  // ★ Helper to get admin emails for login notification
  private async getAdminEmails(): Promise<string[]> {
    try {
      const adminUsers = await User.findAll({
        where: { isActive: true },
        include: [
          {
            model: Role,
            as: "role",
            where: {
              name: { [Op.in]: ["admin"] },
              isActive: true,
            },
            attributes: ["id", "name"],
          },
        ],
        attributes: ["id", "email"],
      });

      return adminUsers.map((u: any) => u.email).filter(Boolean);
    } catch (error) {
      logger.error("Failed to fetch admin emails:", error);
      return [];
    }
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
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

    // ★ Send login notification to admin (fire-and-forget)
    this.sendLoginNotification(user, ipAddress, userAgent);

    return {
      user: this.buildUserResponse(user),
      ...tokens,
    };
  }

  // ★ Fire-and-forget login notification
  private async sendLoginNotification(
    user: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const adminEmails = await this.getAdminEmails();

      if (adminEmails.length === 0) {
        logger.info("No admin emails found for login notification");
        return;
      }

      const loginData = {
        userName: user.name || user.email,
        userEmail: user.email,
        userRole: user.role?.displayName || user.role?.name || "Unknown",
        loginTime: new Date(),
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      };

      // Send to all admins
      for (const adminEmail of adminEmails) {
        // Don't notify admin about their own login
        if (adminEmail === user.email) continue;

        const sent = await sendLoginNotificationEmail(adminEmail, loginData);

        // Log the email
        await EmailLog.create({
          toEmail: adminEmail,
          subject: `Login Alert: ${loginData.userName} (${loginData.userRole}) - ESIPL`,
          type: "login_notification",
          referenceId: user.id,
          referenceType: "user",
          status: sent ? "sent" : "failed",
          sentBy: user.id,
        });

        if (!sent) {
          logger.warn(
            `Failed to send login notification to ${adminEmail}`
          );
        }
      }
    } catch (error) {
      // Never let notification failure break the login flow
      logger.error("Login notification email failed:", error);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findOne({
        where: {
          id: decoded.userId,
          refreshToken,
          isActive: true,
        },
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
    await User.update(
      { refreshToken: null },
      { where: { id: userId } }
    );
  }

  async requestOTP(
    email: string,
    type: "login" | "discount" | "master_activation",
    requestedBy?: string,
    entityId?: string,
    entityType?: string,
    entityName?: string
  ) {
    const recentOTP = await OTPLog.findOne({
      where: {
        email,
        type,
        createdAt: {
          [Op.gte]: new Date(
            Date.now() - env.otp.resendCooldownSeconds * 1000
          ),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (recentOTP) {
      throw ApiError.tooManyRequests(
        `Please wait ${env.otp.resendCooldownSeconds} seconds before requesting a new OTP`
      );
    }

    const recentAttempts = await OTPLog.count({
      where: {
        email,
        type,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentAttempts >= env.otp.maxResend) {
      throw ApiError.tooManyRequests(
        "Maximum OTP requests reached. Try again later."
      );
    }

    await OTPLog.update(
      { status: "expired" },
      { where: { email, type, status: "pending" } }
    );

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + env.otp.expiryMinutes * 60 * 1000
    );

    const otpLog = await OTPLog.create({
      type,
      entityId: entityId || null,
      entityType: entityType || null,
      entityName: entityName || null,
      email,
      otpHash,
      requestedBy: requestedBy || null,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
    });

    const emailSent = await sendOTPEmail(
      email,
      otp,
      type.replace("_", " ")
    );

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

    return {
      otpLogId: otpLog.id,
      message: "OTP sent successfully",
      expiresAt,
    };
  }

  async verifyOTPCode(
    email: string,
    otp: string,
    otpLogId: string
  ): Promise<{ success: boolean; otpLog: OTPLog }> {
    const otpLog = await OTPLog.findOne({
      where: { id: otpLogId, email, status: "pending" },
    });

    if (!otpLog) throw ApiError.badRequest("Invalid OTP request");

    if (isOTPExpired(otpLog.createdAt, env.otp.expiryMinutes)) {
      await otpLog.update({ status: "expired" });
      throw ApiError.badRequest("OTP has expired");
    }

    if (
      otpLog.maxAttempts > 0 &&
      otpLog.attempts >= otpLog.maxAttempts
    ) {
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

    return { success: true, otpLog: otpLog.toJSON() };
  }

  async getProfile(userId: string) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: [
            "id",
            "name",
            "displayName",
            "permissions",
            "discountMin",
            "discountMax",
            "requireOtpForMaster",
          ],
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