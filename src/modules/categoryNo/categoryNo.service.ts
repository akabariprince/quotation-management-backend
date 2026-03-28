import { Op, WhereOptions } from "sequelize";
import { BaseCrudService } from "../shared/baseCrud.service";
import CategoryNo from "../../models/CategoryNo.model";
import Quotation from "../../models/Quotation.model";
import { ApiError } from "../../utils/ApiError";
import { quotationService } from "../quotation/quotation.service";

class CategoryNoService extends BaseCrudService<CategoryNo> {
  constructor() {
    super(CategoryNo, "CategoryNo");
  }

  async findAll(query: any, additionalWhere?: WhereOptions, include?: any[]) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
      status,
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { ...additionalWhere };

    if (search) {
      where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }];
    }
    if (status) {
      where.status = status;
    }

    const sortFieldMap: Record<string, string> = {
      name: "name",
      createdAt: "created_at",
      updatedAt: "updated_at",
      status: "status",
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

  async create(data: any) {
    const trimmedName = data.name?.trim();
    const existing = await CategoryNo.findOne({
      where: { name: { [Op.iLike]: trimmedName } },
    });
    if (existing) {
      throw ApiError.badRequest("A category no with this name already exists");
    }
    return super.create({ ...data, name: trimmedName });
  }

  async update(id: string, data: any) {
    if (data.name) {
      const trimmedName = data.name.trim();
      const existing = await CategoryNo.findOne({
        where: {
          name: { [Op.iLike]: trimmedName },
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw ApiError.badRequest(
          "A category no with this name already exists"
        );
      }
      data = { ...data, name: trimmedName };
    }

    const result = await super.update(id, data);

    // Cascade: regenerate partCode in Quotations + ProjectItems
    if (data.name) {
      await quotationService.regeneratePartCodesForMaster(
        "category_no_id",
        id
      );
    }

    return result;
  }

  async delete(id: string) {
    const usedCount = await Quotation.count({
      where: { categoryNoId: id },
    });
    if (usedCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: this category no is used in ${usedCount} product${usedCount > 1 ? "s" : ""}`
      );
    }
    return super.delete(id);
  }
}

export const categoryNoService = new CategoryNoService();