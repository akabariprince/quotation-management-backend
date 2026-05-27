import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface SelectionVariantMappingAttributes {
  id: string;
  selectionId: string;
  variantId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SelectionVariantMappingCreationAttributes
  extends Optional<
    SelectionVariantMappingAttributes,
    "id" | "createdAt" | "updatedAt"
  > {}

class SelectionVariantMapping
  extends Model<
    SelectionVariantMappingAttributes,
    SelectionVariantMappingCreationAttributes
  >
  implements SelectionVariantMappingAttributes
{
  public id!: string;
  public selectionId!: string;
  public variantId!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

SelectionVariantMapping.init(
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
    variantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "variant_id",
      references: { model: "variants", key: "id" },
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "selection_variant_mappings",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["selection_id", "variant_id"] }],
  },
);

export default SelectionVariantMapping;
