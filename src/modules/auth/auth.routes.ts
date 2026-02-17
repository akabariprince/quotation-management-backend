// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  authRateLimiter,
  otpRateLimiter,
} from "../../middleware/rateLimiter.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  requestOTPSchema,
  verifyOTPSchema,
} from "./auth.validation";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login,
);
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/otp/request",
  otpRateLimiter,
  validate(requestOTPSchema),
  authController.requestOTP,
);
router.post(
  "/otp/verify",
  authRateLimiter,
  validate(verifyOTPSchema),
  authController.verifyOTP,
);
router.get("/profile", authenticate, authController.getProfile);
router.get("/login-users", authController.getLoginUsers);
export default router;
