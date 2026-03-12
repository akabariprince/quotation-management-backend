import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/master", reportsController.getMasterReport);
router.get("/quotation-summary", reportsController.getQuotationSummaryReport);
router.get("/conversion", reportsController.getConversionReport);
router.get("/pending", reportsController.getPendingReport);
router.get(
  "/salesman-performance",
  reportsController.getSalesmanPerformanceReport,
);
router.get("/customer-history", reportsController.getCustomerHistoryReport);
router.get("/product", reportsController.getProductReport);
router.get("/discount-approval", reportsController.getDiscountApprovalReport);
router.get(
  "/detailed/:projectId",
  reportsController.getDetailedQuotationReport,
);

export default router;
