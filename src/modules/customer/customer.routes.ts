// src/modules/customer/customer.routes.ts
import { Router } from 'express';
import { customerController } from './customer.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createCustomerSchema, updateCustomerSchema } from './customer.validation';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', validate(createCustomerSchema), customerController.create);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);

export default router;