// src/modules/user/user.service.ts
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import User from '../../models/User.model';
import Role from '../../models/Role.model';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.utils';

class UserService {
  async findAll(query: any) {
    const pagination = parsePagination(query, 'createdAt', [
      'createdAt', 'name', 'email',
    ]);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.roleId) where.roleId = query.roleId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] },
      ],
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  async getSalesPersons() {
    return User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email'],
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'displayName', 'permissions'] },
      ],
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async create(data: any) {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) throw ApiError.conflict('Email already exists');

    const role = await Role.findByPk(data.roleId);
    if (!role) throw ApiError.badRequest('Invalid role ID');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, password: hashedPassword });

    return this.findById(user.id);
  }

  async update(id: string, data: any) {
    const user = await User.findByPk(id);
    if (!user) throw ApiError.notFound('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({
        where: { email: data.email, id: { [Op.ne]: id } },
      });
      if (existing) throw ApiError.conflict('Email already exists');
    }

    if (data.roleId) {
      const role = await Role.findByPk(data.roleId);
      if (!role) throw ApiError.badRequest('Invalid role ID');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    await user.update(data);
    return this.findById(id);
  }

  async delete(id: string) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) throw ApiError.notFound('User not found');

    if (user.role?.name === 'admin') {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const adminCount = await User.count({ where: { roleId: adminRole.id } });
        if (adminCount <= 1) {
          throw ApiError.badRequest('Cannot delete the last admin user');
        }
      }
    }

    await user.destroy();
  }
}

export const userService = new UserService();