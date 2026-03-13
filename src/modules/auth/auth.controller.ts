// src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { authService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../types";

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    // ★ Extract IP and User-Agent for login notification
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = await authService.login(
      email,
      password,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(ApiResponse.success(result, "Token refreshed successfully"));
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.logout(req.user!.userId);
    res.json(ApiResponse.success(null, "Logged out successfully"));
  });
  requestOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, type, entityId, entityType, entityName, requestedBy } = req.body;

    const result = await authService.requestOTP(
      email,
      type,
      requestedBy,
      entityId,
      entityType,
      entityName
    );
    res.json(ApiResponse.success(result, "OTP sent successfully"));
  });

  verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, otpLogId } = req.body;
    const result = await authService.verifyOTPCode(email, otp, otpLogId);
    res.json(ApiResponse.success(result, "OTP verified successfully"));
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.user!.userId);
    res.json(ApiResponse.success(user));
  });

  getLoginUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await authService.getLoginUsers();
    res.json(ApiResponse.success(users));
  });
}

export const authController = new AuthController();