import { Op } from "sequelize";
import { BaseCrudService } from "../shared/baseCrud.service";
import QuotationType from "../../models/QuotationType.model";
import Quotation from "../../models/Quotation.model";
import { ApiError } from "../../utils/ApiError";
import { quotationService } from "../quotation/quotation.service";

class QuotationTypeService extends BaseCrudService<QuotationType> {
  constructor() {
    super(QuotationType, "QuotationType");
  }

  async create(data: any) {
    const trimmedName = data.name?.trim();
    const existing = await QuotationType.findOne({
      where: { name: { [Op.iLike]: trimmedName } },
    });
    if (existing) {
      throw ApiError.badRequest("A type with this name already exists");
    }
    return super.create({ ...data, name: trimmedName });
  }

  async update(id: string, data: any) {
    if (data.name) {
      const trimmedName = data.name.trim();
      const existing = await QuotationType.findOne({
        where: {
          name: { [Op.iLike]: trimmedName },
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw ApiError.badRequest("A type with this name already exists");
      }
      data = { ...data, name: trimmedName };
    }

    const result = await super.update(id, data);

    // Cascade: regenerate partCode in Quotations + ProjectItems
    if (data.name) {
      await quotationService.regeneratePartCodesForMaster(
        "quotation_type_id",
        id
      );
    }

    return result;
  }

  async delete(id: string) {
    const usedCount = await Quotation.count({
      where: { quotationTypeId: id },
    });
    if (usedCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: this type is used in ${usedCount} product${usedCount > 1 ? "s" : ""}`
      );
    }
    return super.delete(id);
  }
}

export const quotationTypeService = new QuotationTypeService();