// src/modules/role/role.controller.ts
import { Request, Response } from 'express';
import { roleService } from './role.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

class RoleController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await roleService.findAll(req.query);
    res.json(ApiResponse.success(result.data, 'Roles fetched', 200, result.meta));
  });

  getActive = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await roleService.findAllActive();
    res.json(ApiResponse.success(roles, 'Active roles fetched'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.findById(req.params.id as string);
    res.json(ApiResponse.success(role));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.create(req.body);
    res.status(201).json(ApiResponse.created(role, 'Role created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const role = await roleService.update(req.params.id as string, req.body);
    res.json(ApiResponse.success(role, 'Role updated'));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await roleService.delete(req.params.id as string);
    res.json(ApiResponse.noContent('Role deleted'));
  });

  getPermissions = asyncHandler(async (_req: Request, res: Response) => {
    const meta = await roleService.getPermissionsMeta();
    res.json(ApiResponse.success(meta, 'Permissions metadata'));
  });
}

export const roleController = new RoleController();