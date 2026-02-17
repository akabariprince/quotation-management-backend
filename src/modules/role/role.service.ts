// src/modules/role/role.service.ts
import { Op } from "sequelize";
import Role from "../../models/Role.model";
import User from "../../models/User.model";
import { ApiError } from "../../utils/ApiError";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  Permission,
} from "../../utils/permissions";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../utils/pagination.utils";

class RoleService {
  async findAll(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "name",
      "displayName",
    ]);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { displayName: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    }

    const { count, rows } = await Role.findAndCountAll({
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

  async findAllActive() {
    return Role.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "displayName", "permissions"],
      order: [["displayName", "ASC"]],
    });
  }

  async findById(id: string) {
    const role = await Role.findByPk(id);
    if (!role) throw ApiError.notFound("Role not found");
    return role;
  }

  async create(data: any) {
    const existing = await Role.findOne({ where: { name: data.name } });
    if (existing) throw ApiError.conflict("Role name already exists");

    const invalidPerms = (data.permissions as string[]).filter(
      (p): p is string => !ALL_PERMISSIONS.includes(p as Permission),
    );

    if (invalidPerms.length > 0) {
      throw ApiError.badRequest(
        `Invalid permissions: ${invalidPerms.join(", ")}`,
      );
    }

    return Role.create(data);
  }

  async update(id: string, data: any) {
    const role = await this.findById(id);

    if (role.isSystem && data.name && data.name !== role.name) {
      throw ApiError.badRequest("Cannot rename system roles");
    }

    if (data.permissions) {
      const invalidPerms = (data.permissions as string[]).filter(
        (p): p is string => !ALL_PERMISSIONS.includes(p as Permission),
      );

      if (invalidPerms.length > 0) {
        throw ApiError.badRequest(
          `Invalid permissions: ${invalidPerms.join(", ")}`,
        );
      }
    }

    await role.update(data);
    return role;
  }

  async delete(id: string) {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw ApiError.badRequest("Cannot delete system roles");
    }

    const userCount = await User.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete role. ${userCount} user(s) assigned to it.`,
      );
    }

    await role.destroy();
  }

  async getPermissionsMeta() {
    return {
      allPermissions: ALL_PERMISSIONS,
      labels: PERMISSION_LABELS,
      groups: PERMISSION_GROUPS,
    };
  }
}

export const roleService = new RoleService();
