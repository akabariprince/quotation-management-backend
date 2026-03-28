import { Op } from "sequelize";
import { BaseCrudService } from "../shared/baseCrud.service";
import Variant from "../../models/Variant.model";
import Quotation from "../../models/Quotation.model";
import { ApiError } from "../../utils/ApiError";
import { quotationService } from "../quotation/quotation.service";

class VariantService extends BaseCrudService<Variant> {
  constructor() {
    super(Variant, "Variant");
  }

  async create(data: any) {
    const trimmedName = data.name?.trim();
    const existing = await Variant.findOne({
      where: { name: { [Op.iLike]: trimmedName } },
    });
    if (existing) {
      throw ApiError.badRequest("A variant with this name already exists");
    }
    return super.create({ ...data, name: trimmedName });
  }

  async update(id: string, data: any) {
    if (data.name) {
      const trimmedName = data.name.trim();
      const existing = await Variant.findOne({
        where: {
          name: { [Op.iLike]: trimmedName },
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw ApiError.badRequest("A variant with this name already exists");
      }
      data = { ...data, name: trimmedName };
    }

    const result = await super.update(id, data);

    // Cascade: regenerate partCode in Quotations + ProjectItems
    if (data.name) {
      await quotationService.regeneratePartCodesForMaster("variant_id", id);
    }

    return result;
  }

  async delete(id: string) {
    const usedCount = await Quotation.count({
      where: { variantId: id },
    });
    if (usedCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete: this variant is used in ${usedCount} product${usedCount > 1 ? "s" : ""}`
      );
    }
    return super.delete(id);
  }
}

export const variantService = new VariantService();