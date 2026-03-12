import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface CategoryNoAttributes {
  id: string;
  name: string;
  categoryId: string;
  status: "pending" | "active";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CategoryNoCreationAttributes extends Optional<
  CategoryNoAttributes,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
> { }

class CategoryNo
  extends Model<CategoryNoAttributes, CategoryNoCreationAttributes>
  implements CategoryNoAttributes {
  public id!: string;
  public name!: string;
  public categoryId!: string;
  public status!: "pending" | "active";
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

CategoryNo.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: {
        model: "categories",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "active"),
      allowNull: false,
      defaultValue: "pending",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "category_nos",
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default CategoryNo;
