// src/modules/otp/otp.service.ts
import { Op } from "sequelize";
import { OTPLog, User, EmailLog } from "../../models";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../utils/pagination.utils";
import { verifyOTP as verifyOTPHash } from "../../utils/otp.utils";
import { sendOTPEmail } from "../../utils/email.service";
import { generateOTP, hashOTP } from "../../utils/otp.utils";
import { env } from "../../config/environment";
import { logger } from "../../utils/logger";

class OTPService {
  // ─── List All OTP Logs ────────────────────────────────────────────────

  async findAll(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "type",
      "status",
      "email",
    ]);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [{ email: { [Op.iLike]: `%${query.search}%` } }];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.email) where.email = { [Op.iLike]: `%${query.email}%` };
    if (query.startDate && query.endDate) {
      where.createdAt = {
        [Op.between]: [new Date(query.startDate), new Date(query.endDate)],
      };
    }

    const { count, rows } = await OTPLog.findAndCountAll({
      where,
      include: [
        { model: User, as: "requester", attributes: ["id", "name", "email"] },
        { model: User, as: "approver", attributes: ["id", "name", "email"] },
      ],
      attributes: { exclude: ["otpHash"] },
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  // ─── Get Pending Approvals ────────────────────────────────────────────

  async getPendingApprovals(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "type",
    ]);

    const { count, rows } = await OTPLog.findAndCountAll({
      where: {
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [
        { model: User, as: "requester", attributes: ["id", "name", "email"] },
      ],
      attributes: { exclude: ["otpHash"] },
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  // ─── Approve OTP (admin verifies the code) ───────────────────────────

  async approveOTP(id: string, otp: string, approverId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    if (new Date() > otpLog.expiresAt) {
      await otpLog.update({ status: "expired" });
      throw new Error("OTP has expired");
    }

    // Check max attempts
    if (otpLog.attempts >= otpLog.maxAttempts) {
      await otpLog.update({ status: "expired" });
      throw new Error("Maximum attempts exceeded. OTP expired.");
    }

    // Verify OTP hash
    const isValid = await verifyOTPHash(otp, otpLog.otpHash);
    if (!isValid) {
      const newAttempts = otpLog.attempts + 1;
      await otpLog.update({ attempts: newAttempts });

      if (newAttempts >= otpLog.maxAttempts) {
        await otpLog.update({ status: "expired" });
        throw new Error("Maximum attempts exceeded. OTP expired.");
      }

      const remaining = otpLog.maxAttempts - newAttempts;
      throw new Error(
        `Invalid OTP. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
      );
    }

    await otpLog.update({
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    return otpLog;
  }

  // ─── Reject OTP ───────────────────────────────────────────────────────

  async rejectOTP(id: string, reason: string, approverId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    await otpLog.update({
      status: "expired",
      approvedBy: approverId,
    });

    return otpLog;
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────

  async resendOTP(id: string, userId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    await otpLog.update({
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000),
    });

    // Send email
    const emailSent = await sendOTPEmail(
      otpLog.email,
      otp,
      otpLog.type.replace("_", " "),
    );

    // Log the email
    await EmailLog.create({
      toEmail: otpLog.email,
      subject: `OTP Resent - ${otpLog.type}`,
      type: "otp",
      referenceId: otpLog.id,
      referenceType: "otp_log",
      status: emailSent ? "sent" : "failed",
      sentBy: userId || null,
    });

    if (!emailSent) {
      logger.warn(`Failed to resend OTP email to ${otpLog.email}`);
    }

    return { message: "OTP resent successfully" };
  }
}

export const otpService = new OTPService();
