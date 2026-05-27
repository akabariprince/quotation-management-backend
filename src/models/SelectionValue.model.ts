import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface SelectionValueAttributes {
  id: string;
  selectionId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SelectionValueCreationAttributes
  extends Optional<
    SelectionValueAttributes,
    "id" | "sortOrder" | "createdAt" | "updatedAt"
  > {}

class SelectionValue
  extends Model<SelectionValueAttributes, SelectionValueCreationAttributes>
  implements SelectionValueAttributes
{
  public id!: string;
  public selectionId!: string;
  public name!: string;
  public sortOrder!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

SelectionValue.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    selectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "selection_id",
      references: { model: "selections", key: "id" },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "sort_order",
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "selection_values",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["selection_id", "name"] }],
  },
);

export default SelectionValue;
