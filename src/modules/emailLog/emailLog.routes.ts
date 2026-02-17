// src/modules/emailLog/emailLog.routes.ts
import { Router } from 'express';
import { emailLogController } from './emailLog.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', emailLogController.getAll);
router.get('/stats', emailLogController.getStats);

export default router;