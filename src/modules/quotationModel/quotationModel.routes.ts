import { Router } from 'express';
import { quotationModelController } from './quotationModel.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import {
  createQuotationModelSchema,
  updateQuotationModelSchema,
} from './quotationModel.validation';
import { PERMISSIONS } from '../../utils/permissions';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_MODEL_VIEW),
  quotationModelController.getAll
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_MODEL_VIEW),
  quotationModelController.getById
);
router.post(
  '/',
  requirePermission(PERMISSIONS.QUOTATION_MODEL_CREATE),
  validate(createQuotationModelSchema),
  quotationModelController.create
);
router.put(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_MODEL_EDIT),
  validate(updateQuotationModelSchema),
  quotationModelController.update
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.QUOTATION_MODEL_DELETE),
  quotationModelController.delete
);

export default router;