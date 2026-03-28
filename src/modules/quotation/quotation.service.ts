import { BaseCrudService } from "../shared/baseCrud.service";
import Quotation from "../../models/Quotation.model";
import Category from "../../models/Category.model";
import CategoryNo from "../../models/CategoryNo.model";
import QuotationType from "../../models/QuotationType.model";
import Variant from "../../models/Variant.model";
import ProjectItem from "../../models/ProjectItem.model";
import { Op, WhereOptions } from "sequelize";

class QuotationService extends BaseCrudService<Quotation> {
  constructor() {
    super(Quotation, "Quotation");
  }

  /**
   * Build partCode from the 4 master names.
   * Format: "CategoryName-CategoryNoName-TypeName-VariantName"
   */
  buildPartCode(
    category: any,
    categoryNo: any,
    quotationType: any,
    variant: any
  ): string {
    return [
      category?.name || "",
      categoryNo?.name || "",
      quotationType?.name || "",
      variant?.name || "",
    ]
      .filter(Boolean)
      .join("-");
  }

  /**
   * Load fresh master records for a quotation and rebuild its partCode.
   * Returns the new partCode string.
   */
  async rebuildPartCodeForQuotation(quotation: any): Promise<string> {
    const [category, categoryNo, quotationType, variant] = await Promise.all([
      quotation.categoryId
        ? Category.findByPk(quotation.categoryId)
        : null,
      quotation.categoryNoId
        ? CategoryNo.findByPk(quotation.categoryNoId)
        : null,
      quotation.quotationTypeId
        ? QuotationType.findByPk(quotation.quotationTypeId)
        : null,
      quotation.variantId
        ? Variant.findByPk(quotation.variantId)
        : null,
    ]);

    return this.buildPartCode(category, categoryNo, quotationType, variant);
  }

  /**
   * Called from master services when a master name changes.
   * Regenerates partCode on every Quotation using that master,
   * then cascades to all ProjectItems.
   */
  async regeneratePartCodesForMaster(dbColumn: string, masterId: string) {
    const quotations = await Quotation.findAll({
      where: { [dbColumn]: masterId },
      include: [
        { model: Category, as: "category" },
        { model: CategoryNo, as: "categoryNo" },
        { model: QuotationType, as: "quotationType" },
        { model: Variant, as: "variant" },
      ],
    });

    if (quotations.length === 0) return;

    await Promise.all(
      quotations.map(async (q: any) => {
        const newPartCode = this.buildPartCode(
          q.category,
          q.categoryNo,
          q.quotationType,
          q.variant
        );

        await q.update({ partCode: newPartCode });

        // Cascade to all ProjectItems referencing this Quotation
        await ProjectItem.update(
          {
            quotationCode: newPartCode,
            quotationName: q.name,
          },
          { where: { quotationId: q.id } }
        );
      })
    );
  }

  /**
   * Override update: when Quotation is updated,
   * regenerate partCode if any FK changed,
   * and always cascade code + name to ProjectItems.
   */
  async update(id: string, data: any) {
    // 1. Get current quotation before update
    const existing = await Quotation.findByPk(id);
    if (!existing) {
      throw new Error("Quotation not found");
    }

    // 2. Check if any master FK changed
    const fkChanged =
      (data.categoryId !== undefined &&
        data.categoryId !== (existing as any).categoryId) ||
      (data.categoryNoId !== undefined &&
        data.categoryNoId !== (existing as any).categoryNoId) ||
      (data.quotationTypeId !== undefined &&
        data.quotationTypeId !== (existing as any).quotationTypeId) ||
      (data.variantId !== undefined &&
        data.variantId !== (existing as any).variantId);

    // 3. Perform the actual update
    const result = await super.update(id, data);

    // 4. If any FK changed → regenerate partCode
    if (fkChanged) {
      // Reload with new FK values
      const updated = await Quotation.findByPk(id);
      if (updated) {
        const newPartCode = await this.rebuildPartCodeForQuotation(updated);
        await (updated as any).update({ partCode: newPartCode });

        // Cascade to ProjectItems
        await ProjectItem.update(
          {
            quotationCode: newPartCode,
            quotationName: (updated as any).name,
          },
          { where: { quotationId: id } }
        );
      }
    }

    // 5. If name changed (but FK didn't change) → still cascade name + existing code
    if (!fkChanged && data.name !== undefined) {
      const updated = await Quotation.findByPk(id);
      if (updated) {
        await ProjectItem.update(
          {
            quotationCode: (updated as any).partCode,
            quotationName: (updated as any).name,
          },
          { where: { quotationId: id } }
        );
      }
    }

    return result;
  }

  async findAll(query: any, additionalWhere?: WhereOptions, include?: any[]) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "created_at",
      sortOrder = "DESC",
      categoryId,
      categoryNoId,
      quotationTypeId,
      variantId,
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

    if (categoryId) where.category_id = categoryId;
    if (categoryNoId) where.category_no_id = categoryNoId;
    if (quotationTypeId) where.quotation_type_id = quotationTypeId;
    if (variantId) where.variant_id = variantId;
    if (status) where.status = status;

    const sortFieldMap: Record<string, string> = {
      name: "name",
      partCode: "part_code",
      basePrice: "base_price",
      createdAt: "created_at",
      updatedAt: "updated_at",
      status: "status",
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