// src/modules/otp/otp.controller.ts
import { Request, Response } from "express";
import { otpService } from "./otp.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

class OTPController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.findAll(req.query);
    res.json(
      ApiResponse.success(result.data, "OTP logs fetched", 200, result.meta)
    );
  });

  getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.getPendingApprovals(req.query);
    res.json(
      ApiResponse.success(
        result.data,
        "Pending approvals fetched",
        200,
        result.meta
      )
    );
  });

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await otpService.getStats();
    res.json(ApiResponse.success(stats, "Stats fetched"));
  });

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

  directApprove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = (req as any).user;
    const adminUserId = adminUser?.id || adminUser?.userId;
    // Verify admin role
    if (adminUser?.roleName !== "admin") {
      return res
        .status(403)
        .json(
          ApiResponse.error(
            "Only admin users can directly approve without OTP",
            403
          )
        );
    }

    const result = await otpService.directApprove(id as string, adminUserId);
    res.json(ApiResponse.success(result, "Approved directly by admin"));
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const result = await otpService.rejectOTP(
      id as string,
      reason || "",
      userId
    );
    res.json(ApiResponse.success(result, "OTP rejected"));
  });

  resend = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const result = await otpService.resendOTP(id as string, userId);
    res.json(ApiResponse.success(result, "OTP resent successfully"));
  });
}

export const otpController = new OTPController();