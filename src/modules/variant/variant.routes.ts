import { Router } from 'express';
import { variantController } from './variant.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createVariantSchema, updateVariantSchema } from './variant.validation';

const router = Router();

router.use(authenticate);

router.get('/', variantController.getAll);
router.get('/:id', variantController.getById);
router.post('/', validate(createVariantSchema), variantController.create);
router.put('/:id', validate(updateVariantSchema), variantController.update);
router.delete('/:id', variantController.delete);

export default router;