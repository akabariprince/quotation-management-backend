// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import { User, Role, OTPLog } from "../../models";
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
import { notificationService } from "../../services/notification.service";
import { NOTIFICATION_TYPES } from "../../services/notification.constants";

export class AuthService {
  private buildOtpEmailContext(
    type: "login" | "discount" | "master_activation",
    metadata?: Record<string, any>,
  ) {
    if (type === "discount") {
      return {
        description:
          "An OTP has been requested to approve a discount override outside the allowed role range.",
        infoRows: [
          ...(metadata?.projectNo
            ? [{ label: "Project No", value: `<strong>${metadata.projectNo}</strong>` }]
            : []),
          ...(metadata?.customerName
            ? [{ label: "Customer", value: metadata.customerName }]
            : []),
          ...(metadata?.productName
            ? [{ label: "Product", value: metadata.productName }]
            : []),
          ...(metadata?.requestedDiscount
            ? [{ label: "Requested Discount", value: `${metadata.requestedDiscount}%` }]
            : []),
          ...(metadata?.requestedByName
            ? [{ label: "Requested By", value: metadata.requestedByName }]
            : []),
        ],
      };
    }

    if (type === "master_activation") {
      return {
        description:
          "An OTP has been requested to activate or update master data in the system.",
        infoRows: [
          ...(metadata?.recordType
            ? [{ label: "Record Type", value: metadata.recordType }]
            : []),
          ...(metadata?.recordName
            ? [{ label: "Record Name", value: metadata.recordName }]
            : []),
          ...(metadata?.action
            ? [{ label: "Action", value: metadata.action }]
            : []),
          ...(metadata?.requestedByName
            ? [{ label: "Updated By", value: metadata.requestedByName }]
            : []),
        ],
      };
    }

    return undefined;
  }

  private buildOtpWhatsAppParameters(
    type: "login" | "discount" | "master_activation",
    otp: string,
    metadata?: Record<string, any>,
  ) {
    return [otp];
  }

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
  private async getAdminRecipients(): Promise<
    Array<{ email: string; mobile: string | null; whatsappVerified: boolean }>
  > {
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
        attributes: ["id", "email", "mobile", "whatsappVerified"],
      });

      return adminUsers
        .map((u: any) => ({
          email: u.email,
          mobile: u.mobile || null,
          whatsappVerified: Boolean(u.whatsappVerified),
        }))
        .filter((u) => u.email);
    } catch (error) {
      logger.error("Failed to fetch admin emails:", error);
      return [];
    }
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await this.getAdminRecipients();
    return admins.map((u) => u.email).filter(Boolean);
  }

  private getOtpNotificationType(
    type: "login" | "discount" | "master_activation",
  ) {
    if (type === "discount") return NOTIFICATION_TYPES.discountApproval;
    if (type === "master_activation") return NOTIFICATION_TYPES.masterDataChange;
    return NOTIFICATION_TYPES.adminNotification;
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

        await notificationService.dispatchEmail({
          notificationType: NOTIFICATION_TYPES.loginNotification,
          recipient: adminEmail,
          toEmail: adminEmail,
          subject: `Login Alert: ${loginData.userName} (${loginData.userRole}) - ESIPL`,
          referenceId: user.id,
          referenceType: "user",
          sentBy: user.id,
          requestPayload: loginData,
          sendFn: () => sendLoginNotificationEmail(adminEmail, loginData),
        });
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
    entityName?: string,
    metadata?: Record<string, any>,
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

    // Get all admin emails
    const adminRecipients = await this.getAdminRecipients();

    if (adminRecipients.length === 0) {
      logger.warn("No admin emails found for OTP notification");
    }

    for (const adminRecipient of adminRecipients) {
      await notificationService.dispatchEmail({
        notificationType: this.getOtpNotificationType(type),
        recipient: adminRecipient.email,
        toEmail: adminRecipient.email,
        subject: `OTP for ${type}`,
        referenceId: otpLog.id,
        referenceType: "otp_log",
        sentBy: requestedBy || null,
        requestPayload: {
          entityId,
          entityType,
          entityName,
          otpType: type,
          metadata: metadata || null,
        },
        sendFn: () =>
          sendOTPEmail(
            adminRecipient.email,
            otp,
            type.replace("_", " "),
            this.buildOtpEmailContext(type, {
              ...metadata,
              entityType,
              entityName,
            }),
          ),
      });

      if (
        type !== "login" &&
        adminRecipient.mobile &&
        adminRecipient.whatsappVerified
      ) {
        await notificationService.dispatchWhatsApp({
          notificationType: this.getOtpNotificationType(type),
          recipient: adminRecipient.mobile,
          toPhone: adminRecipient.mobile,
          subject: `OTP for ${type}`,
          templateParameters: this.buildOtpWhatsAppParameters(type, otp, {
            ...metadata,
            entityType,
            entityName,
          }),
          referenceId: otpLog.id,
          referenceType: "otp_log",
          sentBy: requestedBy || null,
          requestPayload: {
            entityId,
            entityType,
            entityName,
            otpType: type,
            audience: "admin",
            metadata: metadata || null,
          },
        });
      }
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
