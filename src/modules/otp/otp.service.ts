// src/modules/otp/otp.service.ts
import { Op } from "sequelize";
import { OTPLog, User, EmailLog } from "../../models";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../utils/pagination.utils";
import { verifyOTP as verifyOTPHash } from "../../utils/otp.utils";
import { sendOTPEmail } from "../../services/email.service";
import { generateOTP, hashOTP } from "../../utils/otp.utils";
import { env } from "../../config/environment";
import { logger } from "../../utils/logger";

class OTPService {
  // ─── List All OTP Logs ────────────────────────────────────────────

  async findAll(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "type",
      "status",
      "email",
    ]);

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${query.search}%` } },
        { entityName: { [Op.iLike]: `%${query.search}%` } },
        { entityType: { [Op.iLike]: `%${query.search}%` } },
      ];
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
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "name", "email"],
          required: false,
        },
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

  // ─── Get Pending Approvals ────────────────────────────────────────

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
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "email"],
          required: false,
        },
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

  // ─── Approve OTP (with code verification) ─────────────────────────

  async approveOTP(id: string, otp: string, approverId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    if (new Date() > otpLog.expiresAt) {
      await otpLog.update({ status: "expired" });
      throw new Error("OTP has expired");
    }

    if (otpLog.maxAttempts > 0 && otpLog.attempts >= otpLog.maxAttempts) {
      await otpLog.update({ status: "expired" });
      throw new Error("Maximum attempts exceeded. OTP expired.");
    }

    const isValid = await verifyOTPHash(otp, otpLog.otpHash);
    if (!isValid) {
      const newAttempts = otpLog.attempts + 1;
      await otpLog.update({ attempts: newAttempts });

      if (otpLog.maxAttempts > 0 && newAttempts >= otpLog.maxAttempts) {
        await otpLog.update({ status: "expired" });
        throw new Error("Maximum attempts exceeded. OTP expired.");
      }

      const remaining = otpLog.maxAttempts - newAttempts;
      throw new Error(
        `Invalid OTP. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
      );
    }

    await otpLog.update({
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    // Activate entity if master_activation
    if (
      otpLog.type === "master_activation" &&
      otpLog.entityId &&
      otpLog.entityType
    ) {
      await this.activateEntity(otpLog.entityType, otpLog.entityId);
    }

    // Reload with associations
    await otpLog.reload({
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      attributes: { exclude: ["otpHash"] },
    });

    return otpLog;
  }

  // ─── Direct Approve (Admin – No OTP) ──────────────────────────────

  async directApprove(id: string, adminUserId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("This request is no longer pending");

    if (new Date() > otpLog.expiresAt) {
      await otpLog.update({ status: "expired" });
      throw new Error("This request has expired");
    }

    await otpLog.update({
      status: "approved",
      approvedBy: adminUserId,
      approvedAt: new Date(),
    });

    // Activate entity if master_activation
    if (
      otpLog.type === "master_activation" &&
      otpLog.entityId &&
      otpLog.entityType
    ) {
      await this.activateEntity(otpLog.entityType, otpLog.entityId);
    }

    // Reload with associations
    await otpLog.reload({
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      attributes: { exclude: ["otpHash"] },
    });

    return otpLog;
  }

  // ─── Activate Entity ──────────────────────────────────────────────

  private async activateEntity(entityType: string, entityId: string) {
    try {
      const modelMap: Record<string, () => Promise<any>> = {
        category: () => import("../../models/Category.model"),
        categoryNo: () => import("../../models/CategoryNo.model"),
        quotationType: () => import("../../models/QuotationType.model"),
        quotationModel: () => import("../../models/QuotationModel.model"),
        variant: () => import("../../models/Variant.model"),
        wood: () => import("../../models/Wood.model"),
        polish: () => import("../../models/Polish.model"),
        fabric: () => import("../../models/Fabric.model"),
        quotation: () => import("../../models/Quotation.model"),
      };

      const loader = modelMap[entityType];
      if (!loader) {
        logger.warn(`Unknown entity type for activation: ${entityType}`);
        return;
      }

      const modelModule = await loader();
      const Model = modelModule.default || modelModule;
      const entity = await Model.findByPk(entityId);

      if (entity) {
        await entity.update({ status: "active" });
        logger.info(`Entity activated: ${entityType} (${entityId})`);
      } else {
        logger.warn(
          `Entity not found for activation: ${entityType} (${entityId})`
        );
      }
    } catch (error) {
      logger.error(
        `Failed to activate entity ${entityType} (${entityId}):`,
        error
      );
    }
  }

  // ─── Reject OTP ───────────────────────────────────────────────────

  async rejectOTP(id: string, reason: string, approverId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    await otpLog.update({
      status: "expired",
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    await otpLog.reload({
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      attributes: { exclude: ["otpHash"] },
    });

    return otpLog;
  }

  // ─── Resend OTP ───────────────────────────────────────────────────

  async resendOTP(id: string, userId: string) {
    const otpLog = await OTPLog.findByPk(id);
    if (!otpLog) throw new Error("OTP record not found");
    if (otpLog.status !== "pending")
      throw new Error("OTP is no longer pending");

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    await otpLog.update({
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000),
    });

    const emailSent = await sendOTPEmail(
      otpLog.email,
      otp,
      otpLog.type.replace("_", " ")
    );

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

  // ─── Get Stats ────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const [pendingCount, approvedTodayCount, expiredTodayCount, totalCount] =
      await Promise.all([
        OTPLog.count({
          where: {
            status: "pending",
            expiresAt: { [Op.gt]: now },
          },
        }),
        OTPLog.count({
          where: {
            status: "approved",
            approvedAt: { [Op.gte]: todayStart },
          },
        }),
        OTPLog.count({
          where: {
            status: "expired",
            updatedAt: { [Op.gte]: todayStart },
          },
        }),
        OTPLog.count(),
      ]);

    return {
      pending: pendingCount,
      approvedToday: approvedTodayCount,
      expiredToday: expiredTodayCount,
      total: totalCount,
    };
  }
}

export const otpService = new OTPService();