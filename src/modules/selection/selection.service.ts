import { Includeable, Op, Transaction } from "sequelize";
import { BaseCrudService } from "../shared/baseCrud.service";
import {
  sequelize,
  Selection,
  SelectionValue,
  SelectionVariantMapping,
  Variant,
} from "../../models";
import { ApiError } from "../../utils/ApiError";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../utils/pagination.utils";

class SelectionService extends BaseCrudService<Selection> {
  constructor() {
    super(Selection, "Selection");
  }

  private includeMappings: Includeable[] = [
    {
      model: SelectionVariantMapping,
      as: "variantMappings",
      required: false,
      include: [
        {
          model: Variant,
          as: "variant",
          attributes: ["id", "name", "status"],
          required: false,
        },
      ],
    },
    {
      model: SelectionValue,
      as: "values",
      required: false,
    },
  ];

  private sortSelectionValues(selection: Selection) {
    const values = (selection as any).values;
    if (!Array.isArray(values)) return;
    (selection as any).values = [...values].sort((a: any, b: any) => {
      const first = Number(a?.sortOrder ?? 0);
      const second = Number(b?.sortOrder ?? 0);
      if (first !== second) return first - second;
      return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
    });
  }

  private normalizeValues(values: any[] | undefined, fallbackName: string) {
    if (Array.isArray(values) && values.length > 0) {
      return values
        .map((value: any, index: number) => ({
          name:
            typeof value === "string"
              ? value.trim()
              : value?.name?.trim?.() || "",
          sortOrder:
            typeof value === "string"
              ? index
              : Number(value?.sortOrder ?? index),
        }))
        .filter((value) => value.name.length > 0);
    }

    return [{ name: fallbackName.trim(), sortOrder: 0 }];
  }

  private async replaceValues(
    selectionId: string,
    values: Array<{ name: string; sortOrder: number }>,
    transaction: Transaction,
  ) {
    await SelectionValue.destroy({ where: { selectionId }, transaction });
    if (!values.length) return;
    await SelectionValue.bulkCreate(
      values.map((value) => ({ selectionId, ...value })),
      { transaction },
    );
  }

  private async replaceMappings(
    selectionId: string,
    variantIds: string[],
    transaction: Transaction,
  ) {
    await SelectionVariantMapping.destroy({ where: { selectionId }, transaction });
    if (!variantIds.length) return;
    await SelectionVariantMapping.bulkCreate(
      variantIds.map((variantId) => ({ selectionId, variantId })),
      { transaction },
    );
  }

  async findAll(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "name",
      "category",
      "type",
      "updatedAt",
      "status",
    ]);

    const where: any = {};
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    const { count, rows } = await Selection.findAndCountAll({
      where,
      include: this.includeMappings,
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
    });

    rows.forEach((row) => this.sortSelectionValues(row));

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  async findById(id: string) {
    const record = await Selection.findByPk(id, { include: this.includeMappings });
    if (!record) throw ApiError.notFound("Selection not found");
    this.sortSelectionValues(record);
    return record;
  }

  async create(data: any) {
    const transaction = await sequelize.transaction();
    try {
      const variantIds = data.type === "variant-connected" ? data.variantIds || [] : [];
      if (data.type === "variant-connected" && variantIds.length === 0) {
        throw ApiError.badRequest("Selection Master requires at least one mapped variant");
      }

      const selection = await Selection.create(
        {
          name: data.name,
          category: data.category,
          type: data.type,
          status: data.status,
        },
        { transaction },
      );

      const values = this.normalizeValues(data.values, data.name);
      await this.replaceMappings(selection.id, variantIds, transaction);
      await this.replaceValues(selection.id, values, transaction);
      await transaction.commit();
      return this.findById(selection.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, data: any) {
    const transaction = await sequelize.transaction();
    try {
      const record = await Selection.findByPk(id, { transaction });
      if (!record) throw ApiError.notFound("Selection not found");

      const nextType = data.type ?? record.type;
      const nextVariantIds = data.variantIds ?? [];
      if (
        nextType === "variant-connected" &&
        data.variantIds !== undefined &&
        nextVariantIds.length === 0
      ) {
        throw ApiError.badRequest("Selection Master requires at least one mapped variant");
      }

      await record.update(
        {
          name: data.name ?? record.name,
          category: data.category ?? record.category,
          type: nextType,
          status: data.status ?? record.status,
        },
        { transaction },
      );

      if (data.variantIds !== undefined || data.type === "general") {
        await this.replaceMappings(
          id,
          nextType === "variant-connected" ? nextVariantIds : [],
          transaction,
        );
      }

      const existingValues = await SelectionValue.findAll({
        where: { selectionId: id },
        transaction,
      });
      const shouldSyncValues =
        data.values !== undefined || existingValues.length === 0;

      if (shouldSyncValues) {
        const values = this.normalizeValues(data.values, record.name);
        await this.replaceValues(id, values, transaction);
      }

      await transaction.commit();
      return this.findById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const selectionService = new SelectionService();
