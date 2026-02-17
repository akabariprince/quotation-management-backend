// src/modules/role/role.routes.ts
import { Router } from 'express';
import { roleController } from './role.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { createRoleSchema, updateRoleSchema } from './role.validation';
import { PERMISSIONS } from '../../utils/permissions';

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission(PERMISSIONS.ROLE_VIEW), roleController.getPermissions);
router.get('/active', roleController.getActive);
router.get('/', requirePermission(PERMISSIONS.ROLE_VIEW), roleController.getAll);
router.get('/:id', requirePermission(PERMISSIONS.ROLE_VIEW), roleController.getById);
router.post('/', requirePermission(PERMISSIONS.ROLE_CREATE), validate(createRoleSchema), roleController.create);
router.put('/:id', requirePermission(PERMISSIONS.ROLE_EDIT), validate(updateRoleSchema), roleController.update);
router.delete('/:id', requirePermission(PERMISSIONS.ROLE_DELETE), roleController.delete);

export default router;