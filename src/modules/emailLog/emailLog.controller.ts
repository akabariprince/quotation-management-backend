// src/modules/emailLog/emailLog.controller.ts
import { Request, Response } from 'express';
import { emailLogService } from './emailLog.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

class EmailLogController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await emailLogService.findAll(req.query);
    res.json(ApiResponse.success(result.data, 'Email logs fetched', 200, result.meta));
  });

  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await emailLogService.getStats();
    res.json(ApiResponse.success(stats, 'Email stats fetched'));
  });
}

export const emailLogController = new EmailLogController();