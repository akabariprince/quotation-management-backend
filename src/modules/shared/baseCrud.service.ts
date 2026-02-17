// src/modules/shared/baseCrud.service.ts
import { Model, ModelStatic, Op, WhereOptions } from 'sequelize';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.utils';

export class BaseCrudService<T extends Model> {
  protected model: ModelStatic<T>;
  protected modelName: string;

  constructor(model: ModelStatic<T>, modelName: string) {
    this.model = model;
    this.modelName = modelName;
  }

  async findAll(query: any, additionalWhere: WhereOptions = {}, include: any[] = []) {
    const pagination = parsePagination(query, 'createdAt', ['createdAt', 'name', 'updatedAt', 'status']);

    const where: any = { ...additionalWhere };

    if (query.search) {
      where.name = { [Op.iLike]: `%${query.search}%` };
    }

    if (query.status) {
      where.status = query.status;
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      include,
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const meta = buildPaginationMeta(count, pagination.page, pagination.limit);

    return { data: rows, meta };
  }

  async findById(id: string, include: any[] = []) {
    const record = await this.model.findByPk(id, { include });
    if (!record) {
      throw ApiError.notFound(`${this.modelName} not found`);
    }
    return record;
  }

  async create(data: any) {
    return this.model.create(data);
  }

  async update(id: string, data: any) {
    const record = await this.findById(id);
    await (record as any).update(data);
    return record;
  }

  async delete(id: string) {
    const record = await this.findById(id);
    await (record as any).destroy();
  }
}