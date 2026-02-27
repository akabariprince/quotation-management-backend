// src/models/Role.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface RoleAttributes {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  discountMin: number;
  discountMax: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface RoleCreationAttributes extends Optional<
  RoleAttributes,
  | "id"
  | "description"
  | "permissions"
  | "discountMin"
  | "discountMax"
  | "isActive"
  | "isSystem"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> {}

class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public id!: string;
  public name!: string;
  public displayName!: string;
  public description!: string | null;
  public permissions!: string[];
  public discountMin!: number;
  public discountMax!: number;
  public isActive!: boolean;
  public isSystem!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Role.init(
  {
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
      field: "display_name",
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
    discountMin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_min",
    },
    discountMax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100,
      field: "discount_max",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_system",
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
    deletedAt: { type: DataTypes.DATE, field: "deleted_at" },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default Role;
