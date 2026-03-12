import { BaseCrudService } from '../shared/baseCrud.service';
import CategoryNo from '../../models/CategoryNo.model';
import { Op, WhereOptions } from 'sequelize';

class CategoryNoService extends BaseCrudService<CategoryNo> {
  constructor() {
    super(CategoryNo, 'CategoryNo');
  }

  async findAll(query: any, additionalWhere?: WhereOptions, include?: any[]) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      categoryId,
      status,
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { ...additionalWhere };

    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }];
    }
    if (categoryId) {
      where.category_id = categoryId;
    }
    if (status) {
      where.status = status;
    }

    const sortFieldMap: Record<string, string> = {
      name: 'name',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      status: 'status',
    };
    const actualSortBy = sortFieldMap[sortBy] || sortBy;

    const { rows, count } = await CategoryNo.findAndCountAll({
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

export const categoryNoService = new CategoryNoService();