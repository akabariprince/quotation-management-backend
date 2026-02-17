import { BaseCrudService } from '../shared/baseCrud.service';
import Quotation from '../../models/Quotation.model';
import { Op, WhereOptions } from 'sequelize';

class QuotationService extends BaseCrudService<Quotation> {
  constructor() {
    super(Quotation, 'Quotation');
  }

  // Override findAll matching the base class signature exactly
  async findAll(
    query: any,
    additionalWhere?: WhereOptions,
    include?: any[]
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      categoryId,
      quotationTypeId,
      status,
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { ...additionalWhere };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { part_code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (quotationTypeId) {
      where.quotation_type_id = quotationTypeId;
    }

    if (status) {
      where.status = status;
    }

    // Map camelCase sortBy to snake_case
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      partCode: 'part_code',
      basePrice: 'base_price',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      status: 'status',
    };

    const actualSortBy = sortFieldMap[sortBy] || sortBy;

    const { rows, count } = await Quotation.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[actualSortBy, sortOrder.toUpperCase()]],
      ...(include ? { include } : {}),
    });

    const totalPages = Math.ceil(count / Number(limit));

    return {
      data: rows,
      meta: {
        currentPage: Number(page),
        totalPages,
        totalCount: count,
        limit: Number(limit),
        itemsPerPage: Number(limit),
        totalItems: count,
        hasNextPage: Number(page) < totalPages,
        hasPreviousPage: Number(page) > 1,
      },
    };
  }
}

export const quotationService = new QuotationService();