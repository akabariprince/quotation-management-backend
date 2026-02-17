// src/modules/user/user.routes.ts
import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { createUserSchema, updateUserSchema } from './user.validation';
import { PERMISSIONS } from '../../utils/permissions';
import { asyncHandler } from '@/utils/asyncHandler';
import { Request, Response } from "express";
import { Role, User } from '@/models';
import { ApiResponse } from '@/utils/ApiResponse';
const router = Router();

router.use(authenticate);

router.get('/sales-persons', userController.getSalesPersons);
router.get('/', requirePermission(PERMISSIONS.USER_VIEW), userController.getAll);
router.get('/:id', requirePermission(PERMISSIONS.USER_VIEW), userController.getById);
router.post('/', requirePermission(PERMISSIONS.USER_CREATE), validate(createUserSchema), userController.create);
router.put('/:id', requirePermission(PERMISSIONS.USER_EDIT), validate(updateUserSchema), userController.update);
router.delete('/:id', requirePermission(PERMISSIONS.USER_DELETE), userController.delete);
router.get(
  '/sales-persons',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] }],
      order: [['name', 'ASC']],
    });
    res.json(ApiResponse.success(users, 'Sales persons fetched'));
  })
);
export default router;