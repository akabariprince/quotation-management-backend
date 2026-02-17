// src/models/Role.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface RoleAttributes {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface RoleCreationAttributes extends Optional<RoleAttributes,
  'id' | 'description' | 'permissions' | 'isSystem' | 'isActive' |
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes {
  public id!: string;
  public name!: string;
  public displayName!: string;
  public description!: string | null;
  public permissions!: string[];
  public isSystem!: boolean;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Role.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'display_name',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  permissions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_system',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, field: 'deleted_at' },
}, {
  sequelize,
  tableName: 'roles',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default Role;