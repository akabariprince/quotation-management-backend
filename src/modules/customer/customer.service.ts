// src/modules/customer/customer.service.ts
import { Op } from 'sequelize';
import Customer from '../../models/Customer.model';
import User from '../../models/User.model';
import { ApiError } from '../../utils/ApiError';
import { AuthUser } from '../../types/express';
import { canManageAllCustomers } from '../../utils/ownership.utils';
import {
  parsePagination,
  buildPaginationMeta,
} from '../../utils/pagination.utils';

class CustomerService {
  /* ─────────────────── LIST ─────────────────── */
  async findAll(query: any, authUser: AuthUser) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'name', 'city', 'state',
    ]);

    const where: any = {};

    // ═══════════════════════════════════════════════════════
    //  NO ownership filter here — ALL users see ALL customers
    //  Ownership is only enforced on edit / delete
    // ═══════════════════════════════════════════════════════

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
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  /* ─────────────────── GET BY ID ─────────────────── */
  async findById(id: string, _authUser?: AuthUser) {
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    if (!customer) throw ApiError.notFound('Customer not found');

    // ══ No ownership check on VIEW — everyone can see any customer ══

    return customer;
  }

  /* ─────────────────── CREATE ─────────────────── */
  async create(data: any, authUser: AuthUser) {
    return Customer.create({
      ...data,
      createdBy: authUser.id,
    });
  }

  /* ─────────────────── UPDATE ─────────────────── */
  async update(id: string, data: any, authUser: AuthUser) {
    const customer = await this.findById(id);
    this.assertOwnership(customer, authUser, 'edit');
    await customer.update(data);
    return customer;
  }

  /* ─────────────────── DELETE ─────────────────── */
  async delete(id: string, authUser: AuthUser) {
    const customer = await this.findById(id);
    this.assertOwnership(customer, authUser, 'delete');
    await customer.destroy();
  }

  /* ─────── private: ownership guard (edit/delete only) ─────── */
  private assertOwnership(customer: Customer, authUser: AuthUser, action: string) {
    if (canManageAllCustomers(authUser)) return;          // has customer:manage_all
    if (customer.createdBy === authUser.id) return;       // is the owner

    throw ApiError.forbidden(
      `You can only ${action} customers you created`,
    );
  }
}

export const customerService = new CustomerService();