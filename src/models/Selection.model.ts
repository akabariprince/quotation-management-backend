import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

export type SelectionCategory =
  | "wood"
  | "fabric"
  | "leather"
  | "leather-rite"
  | "metal"
  | "glass"
  | "stone"
  | "polish"
  | "paint";

interface SelectionAttributes {
  id: string;
  name: string;
  category: SelectionCategory;
  type: "variant-connected" | "general";
  status: "pending" | "active";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface SelectionCreationAttributes
  extends Optional<
    SelectionAttributes,
    "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

class Selection
  extends Model<SelectionAttributes, SelectionCreationAttributes>
  implements SelectionAttributes
{
  public id!: string;
  public name!: string;
  public category!: SelectionCategory;
  public type!: "variant-connected" | "general";
  public status!: "pending" | "active";
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Selection.init(
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
    category: {
      type: DataTypes.ENUM(
        "wood",
        "fabric",
        "leather",
        "leather-rite",
        "metal",
        "glass",
        "stone",
        "polish",
        "paint",
      ),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("variant-connected", "general"),
      allowNull: false,
      defaultValue: "general",
    },
    status: {
      type: DataTypes.ENUM("pending", "active"),
      allowNull: false,
      defaultValue: "pending",
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
    deletedAt: { type: DataTypes.DATE, field: "deleted_at" },
  },
  {
    sequelize,
    tableName: "selections",
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default Selection;
