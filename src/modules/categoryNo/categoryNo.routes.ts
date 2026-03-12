import { Router } from 'express';
import { categoryNoController } from './categoryNo.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createCategoryNoSchema, updateCategoryNoSchema } from './categoryNo.validation';

const router = Router();

router.use(authenticate);

router.get('/', categoryNoController.getAll);
router.get('/:id', categoryNoController.getById);
router.post('/', validate(createCategoryNoSchema), categoryNoController.create);
router.put('/:id', validate(updateCategoryNoSchema), categoryNoController.update);
router.delete('/:id', categoryNoController.delete);

export default router;