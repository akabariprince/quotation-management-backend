// src/modules/polish/polish.routes.ts
import { Router } from 'express';
import { polishController } from './polish.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createPolishSchema, updatePolishSchema } from './polish.validation';

const router = Router();
router.use(authenticate);
router.get('/', polishController.getAll);
router.get('/:id', polishController.getById);
router.post('/', validate(createPolishSchema), polishController.create);
router.put('/:id', validate(updatePolishSchema), polishController.update);
router.delete('/:id', polishController.delete);

export default router;