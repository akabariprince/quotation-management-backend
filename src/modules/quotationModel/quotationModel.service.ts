import { BaseCrudService } from '../shared/baseCrud.service';
import QuotationModel from '../../models/QuotationModel.model';
import QuotationType from '../../models/QuotationType.model';

class QuotationModelService extends BaseCrudService<QuotationModel> {
  constructor() {
    super(QuotationModel, 'QuotationModel');
  }

  async findAll(query: any) {
    const additionalWhere: any = {};
    if (query.quotationTypeId) {
      additionalWhere.quotationTypeId = query.quotationTypeId;
    }
    return super.findAll(query, additionalWhere, [
      {
        model: QuotationType,
        as: 'quotationType',
        attributes: ['id', 'name'],
      },
    ]);
  }

  async findById(id: string) {
    return super.findById(id, [
      {
        model: QuotationType,
        as: 'quotationType',
        attributes: ['id', 'name'],
      },
    ]);
  }
}

export const quotationModelService = new QuotationModelService();