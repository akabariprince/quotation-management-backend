// src/modules/fabric/fabric.routes.ts
import { Router } from 'express';
import { fabricController } from './fabric.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { createFabricSchema, updateFabricSchema } from './fabric.validation';

const router = Router();
router.use(authenticate);
router.get('/', fabricController.getAll);
router.get('/:id', fabricController.getById);
router.post('/', validate(createFabricSchema), fabricController.create);
router.put('/:id', validate(updateFabricSchema), fabricController.update);
router.delete('/:id', fabricController.delete);

export default router;