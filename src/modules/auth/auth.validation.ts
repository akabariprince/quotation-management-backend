// src/modules/auth/auth.validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const requestOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  type: z.enum(['login', 'discount', 'master_activation']),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  otpLogId: z.string().uuid('Invalid OTP log ID'),
});