// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';

export class AuthController {
  
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(ApiResponse.success(result, 'Login successful'));
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(ApiResponse.success(result, 'Token refreshed successfully'));
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.logout(req.user!.userId);
    res.json(ApiResponse.success(null, 'Logged out successfully'));
  });

  requestOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, type, entityId, entityType } = req.body;
    const result = await authService.requestOTP(
      email,
      type,
      req.user?.userId,
      entityId,
      entityType
    );
    res.json(ApiResponse.success(result, 'OTP sent successfully'));
  });

  verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, otpLogId } = req.body;
    const result = await authService.verifyOTPCode(email, otp, otpLogId);
    res.json(ApiResponse.success(result, 'OTP verified successfully'));
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