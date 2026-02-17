// src/modules/reports/reports.routes.ts
import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/sales', reportsController.getSalesReport);
router.get('/quotations', reportsController.getQuotationReport);
router.get('/customers', reportsController.getCustomerReport);

export default router;