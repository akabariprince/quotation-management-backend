// src/modules/otp/otp.controller.ts
import { Request, Response } from "express";
import { otpService } from "./otp.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

class OTPController {
  // ─── List all OTP logs (admin) ────────────────────────────────────────

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.findAll(req.query);
    res.json(
      ApiResponse.success(result.data, "OTP logs fetched", 200, result.meta),
    );
  });

  // ─── Get pending approvals (admin) ────────────────────────────────────

  getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.getPendingApprovals(req.query);
    res.json(
      ApiResponse.success(
        result.data,
        "Pending approvals fetched",
        200,
        result.meta,
      ),
    );
  });

  // ─── Approve a pending OTP (admin) ────────────────────────────────────

  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!otp || otp.length !== 6) {
      return res
        .status(400)
        .json(ApiResponse.error("Valid 6-digit OTP is required", 400));
    }

    const result = await otpService.approveOTP(id as string, otp, userId);
    res.json(ApiResponse.success(result, "OTP approved successfully"));
  });

  // ─── Reject a pending OTP (admin) ─────────────────────────────────────

  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const result = await otpService.rejectOTP(id as string, reason, userId);
    res.json(ApiResponse.success(result, "OTP rejected"));
  });

  // ─── Resend OTP for existing log (admin) ──────────────────────────────

  resend = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const result = await otpService.resendOTP(id as string, userId);
    res.json(ApiResponse.success(result, "OTP resent successfully"));
  });
}

export const otpController = new OTPController();
