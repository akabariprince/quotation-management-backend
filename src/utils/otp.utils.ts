// src/utils/otp.utils.ts
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
};

export const hashOTP = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const verifyOTP = async (otp: string, hashedOTP: string): Promise<boolean> => {
  return bcrypt.compare(otp, hashedOTP);
};

export const isOTPExpired = (createdAt: Date, expiryMinutes: number): boolean => {
  const now = new Date();
  const expiry = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
  return now > expiry;
};