import { Router } from 'express';
import { quotationController } from './quotation.controller';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { quotationImageUpload } from '../../config/multer.config';
import { PERMISSIONS } from '../../utils/permissions';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_VIEW),
  quotationController.getAll
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_VIEW),
  quotationController.getById
);
router.post(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_CREATE),
  quotationImageUpload.array('images', 10),
  quotationController.create
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_EDIT),
  quotationImageUpload.array('images', 10),
  quotationController.update
);
router.post(
  '/:id/images',
  requirePermission(PERMISSIONS.QUOTATION_EDIT),
  quotationImageUpload.array('images', 10),
  quotationController.uploadImages
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_DELETE),
  quotationController.delete
);

export default router;