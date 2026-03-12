import { Router } from 'express';
import { quotationModelController } from './quotationModel.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import {
  createQuotationModelSchema,
  updateQuotationModelSchema,
} from './quotationModel.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  quotationModelController.getAll
);
router.get(
  '/:id',
  quotationModelController.getById
);
router.post(
  '/',
  validate(createQuotationModelSchema),
  quotationModelController.create
);
router.put(
  '/:id',
  validate(updateQuotationModelSchema),
  quotationModelController.update
);
router.delete(
  '/:id',
  quotationModelController.delete
);

export default router;