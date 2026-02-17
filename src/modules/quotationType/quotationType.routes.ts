import { Router } from 'express';
import { quotationTypeController } from './quotationType.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import {
  createQuotationTypeSchema,
  updateQuotationTypeSchema,
} from './quotationType.validation';
import { PERMISSIONS } from '../../utils/permissions';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_TYPE_VIEW),
  quotationTypeController.getAll
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_TYPE_VIEW),
  quotationTypeController.getById
);
router.post(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_TYPE_CREATE),
  validate(createQuotationTypeSchema),
  quotationTypeController.create
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_TYPE_EDIT),
  validate(updateQuotationTypeSchema),
  quotationTypeController.update
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_TYPE_DELETE),
  quotationTypeController.delete
);

export default router;