import { BaseCrudController } from '../shared/baseCrud.controller';
import { quotationModelService } from './quotationModel.service';
import QuotationModel from '../../models/QuotationModel.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';

class QuotationModelController extends BaseCrudController<QuotationModel> {
  constructor() {
    super(quotationModelService, 'QuotationModel');
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await quotationModelService.findAll(req.query);
    res.json(
      ApiResponse.success(
        result.data,
        'Quotation Models fetched',
        200,
        result.meta
      )
    );
  });
}

export const quotationModelController = new QuotationModelController();