import { Router } from 'express';
import { quotationTypeController } from './quotationType.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import {
  createQuotationTypeSchema,
  updateQuotationTypeSchema,
} from './quotationType.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  quotationTypeController.getAll
);
router.get(
  '/:id',
  quotationTypeController.getById
);
router.post(
  '/',
  validate(createQuotationTypeSchema),
  quotationTypeController.create
);
router.put(
  '/:id',
  validate(updateQuotationTypeSchema),
  quotationTypeController.update
);
router.delete(
  '/:id',
  quotationTypeController.delete
);

export default router;