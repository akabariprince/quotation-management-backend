// src/modules/otp/otp.routes.ts
import { Router } from 'express';
import { otpController } from './otp.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Admin-only: view logs, approve, reject, resend
router.get('/', authorize('admin'), otpController.getAll);
router.get('/pending', authorize('admin'), otpController.getPendingApprovals);
router.post('/:id/approve', authorize('admin'), otpController.approve);
router.post('/:id/reject', authorize('admin'), otpController.reject);
router.post('/:id/resend', authorize('admin'), otpController.resend);

export default router;