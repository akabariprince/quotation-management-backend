import { BaseCrudService } from '../shared/baseCrud.service';
import QuotationType from '../../models/QuotationType.model';
import Category from '../../models/Category.model';

class QuotationTypeService extends BaseCrudService<QuotationType> {
  constructor() {
    super(QuotationType, 'QuotationType');
  }

  async findAll(query: any) {
    const additionalWhere: any = {};
    if (query.categoryId) {
      additionalWhere.categoryId = query.categoryId;
    }
    return super.findAll(query, additionalWhere, [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ]);
  }

  async findById(id: string) {
    return super.findById(id, [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ]);
  }
}

export const quotationTypeService = new QuotationTypeService();