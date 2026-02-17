// src/modules/wood/wood.routes.ts
import { Router } from 'express';
import { woodController } from './wood.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createWoodSchema, updateWoodSchema } from './wood.validation';

const router = Router();
router.use(authenticate);
router.get('/', woodController.getAll);
router.get('/:id', woodController.getById);
router.post('/', validate(createWoodSchema), woodController.create);
router.put('/:id', validate(updateWoodSchema), woodController.update);
router.delete('/:id', woodController.delete);

export default router;