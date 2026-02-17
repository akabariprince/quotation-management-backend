// src/modules/reports/reports.controller.ts
import { Request, Response } from "express";
import { reportsService } from "./reports.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

class ReportsController {
  getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status, salesPersonId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    if (salesPersonId) filters.salesPersonId = salesPersonId;

    const result = await reportsService.getSalesReport(filters);
    res.json(ApiResponse.success(result, "Sales report fetched"));
  });

  getQuotationReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const result = await reportsService.getQuotationReport(filters);
    res.json(ApiResponse.success(result, "Quotation report fetched"));
  });

  getCustomerReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const result = await reportsService.getCustomerReport(filters);
    res.json(ApiResponse.success(result, "Customer report fetched"));
  });
}

export const reportsController = new ReportsController();