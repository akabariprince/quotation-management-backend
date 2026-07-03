// src/modules/customer/customer.routes.ts
import { Router } from 'express';
import { customerController } from './customer.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createCustomerSchema,
  requestCustomerEmailOTPSchema,
  requestCustomerMobileOTPSchema,
  updateCustomerSchema,
  verifyCustomerEmailOTPSchema,
  verifyCustomerMobileOTPSchema,
} from './customer.validation';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getAll);
router.post(
  '/mobile-otp/request',
  validate(requestCustomerMobileOTPSchema),
  customerController.requestMobileOTP,
);
router.post(
  '/mobile-otp/verify',
  validate(verifyCustomerMobileOTPSchema),
  customerController.verifyMobileOTP,
);
router.post(
  '/email-otp/request',
  validate(requestCustomerEmailOTPSchema),
  customerController.requestEmailOTP,
);
router.post(
  '/email-otp/verify',
  validate(verifyCustomerEmailOTPSchema),
  customerController.verifyEmailOTP,
);
router.get('/:id', customerController.getById);
router.post('/', validate(createCustomerSchema), customerController.create);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);

export default router;
