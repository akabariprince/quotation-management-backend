// src/modules/customer/customer.service.ts
import { Op } from 'sequelize';
import Customer from '../../models/Customer.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.utils';

class CustomerService {
  async findAll(query: any) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'name', 'city', 'state',
    ]);

    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { mobile: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
        { city: { [Op.iLike]: `%${query.search}%` } },
        { gstin: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.city) where.city = { [Op.iLike]: `%${query.city}%` };
    if (query.state) where.state = { [Op.iLike]: `%${query.state}%` };
    if (query.region) where.region = query.region;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  async findById(id: string) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }

  async create(data: any) {
    return Customer.create(data);
  }

  async update(id: string, data: any) {
    const customer = await this.findById(id);
    await customer.update(data);
    return customer;
  }

  async delete(id: string) {
    const customer = await this.findById(id);
    await customer.destroy();
  }
}

export const customerService = new CustomerService();