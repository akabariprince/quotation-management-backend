// src/modules/user/user.validation.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  mobile: z.string().min(10).max(20).optional().nullable(),
  verificationOtpLogId: z.string().uuid().optional().nullable(),
  emailVerificationOtpLogId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid('Invalid role ID'),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  mobile: z.string().min(10).max(20).optional().nullable(),
  verificationOtpLogId: z.string().uuid().optional().nullable(),
  emailVerificationOtpLogId: z.string().uuid().optional().nullable(),
  roleId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const requestUserMobileOTPSchema = z.object({
  body: z.object({
    mobile: z.string().min(10).max(20),
  }),
});

export const verifyUserMobileOTPSchema = z.object({
  body: z.object({
    mobile: z.string().min(10).max(20),
    otp: z.string().length(6),
    otpLogId: z.string().uuid(),
  }),
});

export const requestUserEmailOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
  }),
});

export const verifyUserEmailOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    otp: z.string().length(6),
    otpLogId: z.string().uuid(),
  }),
});
