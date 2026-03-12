// src/modules/otp/otp.routes.ts
import { Router } from "express";
import { otpController } from "./otp.controller";
import {
  authenticate,
  requirePermission,
} from "../../middleware/auth.middleware";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();

router.use(authenticate);

// Stats
router.get(
  "/stats",
  otpController.getStats
);

// Pending approvals
router.get(
  "/pending",
  otpController.getPendingApprovals
);

// All logs
router.get(
  "/",
  otpController.getAll
);

// Approve with OTP
router.post(
  "/:id/approve",
  otpController.approve
);

// Direct approve (admin only – no OTP)
router.post(
  "/:id/direct-approve",
  otpController.directApprove
);

// Reject
router.post(
  "/:id/reject",
  otpController.reject
);

// Resend OTP
router.post(
  "/:id/resend",
  otpController.resend
);

export default router;