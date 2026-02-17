import { BaseCrudController } from '../shared/baseCrud.controller';
import { quotationTypeService } from './quotationType.service';
import QuotationType from '../../models/QuotationType.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';

class QuotationTypeController extends BaseCrudController<QuotationType> {
  constructor() {
    super(quotationTypeService, 'QuotationType');
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await quotationTypeService.findAll(req.query);
    res.json(
      ApiResponse.success(
        result.data,
        'Quotation Types fetched',
        200,
        result.meta
      )
    );
  });
}

export const quotationTypeController = new QuotationTypeController();