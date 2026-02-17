// src/modules/dashboard/dashboard.controller.ts
import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

class DashboardController {
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getDashboardStats();
    res.json(ApiResponse.success(stats, 'Dashboard stats fetched'));
  });
}

export const dashboardController = new DashboardController();