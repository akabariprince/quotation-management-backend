import { Request, Response } from "express";
import { reportsService } from "./reports.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

class ReportsController {
  getMasterReport = asyncHandler(async (_req: Request, res: Response) => {
    const result = await reportsService.getMasterReport();
    res.json(ApiResponse.success(result, "Master report fetched"));
  });

  getQuotationSummaryReport = asyncHandler(
    async (req: Request, res: Response) => {
      const {
        startDate,
        endDate,
        status,
        salesPersonId,
        customerId,
        projectName,
        search,
      } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (status) filters.status = status;
      if (salesPersonId) filters.salesPersonId = salesPersonId;
      if (customerId) filters.customerId = customerId;
      if (projectName) filters.projectName = projectName;
      if (search) filters.search = search;
      const result = await reportsService.getQuotationSummaryReport(filters);
      res.json(ApiResponse.success(result, "Quotation summary fetched"));
    },
  );

  getConversionReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, customerId, salesPersonId } = req.query;
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (customerId) filters.customerId = customerId;
    if (salesPersonId) filters.salesPersonId = salesPersonId;
    const result = await reportsService.getConversionReport(filters);
    res.json(ApiResponse.success(result, "Conversion report fetched"));
  });

  getPendingReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, customerId, salesPersonId } = req.query;
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (customerId) filters.customerId = customerId;
    if (salesPersonId) filters.salesPersonId = salesPersonId;
    const result = await reportsService.getPendingQuotationReport(filters);
    res.json(ApiResponse.success(result, "Pending report fetched"));
  });

  getSalesmanPerformanceReport = asyncHandler(
    async (req: Request, res: Response) => {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const result = await reportsService.getSalesmanPerformanceReport(filters);
      res.json(
        ApiResponse.success(result, "Salesman performance report fetched"),
      );
    },
  );

  getCustomerHistoryReport = asyncHandler(
    async (req: Request, res: Response) => {
      const { customerId, startDate, endDate } = req.query;
      const filters: any = {};
      if (customerId) filters.customerId = customerId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const result = await reportsService.getCustomerHistoryReport(filters);
      res.json(ApiResponse.success(result, "Customer history fetched"));
    },
  );

  getProductReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status } = req.query;
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;
    const result = await reportsService.getProductReport(filters);
    res.json(ApiResponse.success(result, "Product report fetched"));
  });

  getDiscountApprovalReport = asyncHandler(
    async (req: Request, res: Response) => {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const result = await reportsService.getDiscountApprovalReport(filters);
      res.json(ApiResponse.success(result, "Discount approval report fetched"));
    },
  );

  getDetailedQuotationReport = asyncHandler(
    async (req: Request, res: Response) => {
      const { projectId } = req.params;
      if (!projectId) {
        return res
          .status(400)
          .json(ApiResponse.error("Project ID is required"));
      }
      const result = await reportsService.getDetailedQuotationReport(
        projectId as string,
      );
      res.json(
        ApiResponse.success(result, "Detailed quotation report fetched"),
      );
    },
  );
}

export const reportsController = new ReportsController();
