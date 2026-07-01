// src/modules/user/user.controller.ts
import { Request, Response } from 'express';
import { userService } from './user.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

class UserController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.findAll(req.query);
    res.json(ApiResponse.success(result.data, 'Users fetched', 200, result.meta));
  });

  getSalesPersons = asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getSalesPersons();
    res.json(ApiResponse.success(users, 'Sales persons fetched'));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.findById(req.params.id as string);
    res.json(ApiResponse.success(user));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    res.status(201).json(ApiResponse.created(user, 'User created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id as string, req.body);
    res.json(ApiResponse.success(user, 'User updated'));
  });

  delete = asyncHandler(async (req: any, res: Response) => {
    await userService.delete(req.params.id as string, req.user.userId);
    res.json(ApiResponse.noContent('User deleted'));
  });

  requestMobileOTP = asyncHandler(async (req: any, res: Response) => {
    const result = await userService.requestMobileOTP(
      req.body.mobile,
      req.user?.userId || req.user?.id,
    );
    res.json(ApiResponse.success(result, "WhatsApp OTP sent"));
  });

  verifyMobileOTP = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.verifyMobileOTP(
      req.body.mobile,
      req.body.otp,
      req.body.otpLogId,
    );
    res.json(ApiResponse.success(result, "WhatsApp mobile verified"));
  });
}

export const userController = new UserController();
