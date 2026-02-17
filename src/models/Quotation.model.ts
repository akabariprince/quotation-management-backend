import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface QuotationAttributes {
  id: string;
  name: string;
  partCode: string;
  categoryId: string;
  quotationTypeId: string;
  quotationModelId: string | null;
  woodId: string | null;
  polishId: string | null;
  fabricId: string | null;
  length: number;
  width: number;
  height: number;
  description: string;
  basePrice: number;
  defaultDiscount: number;
  gstPercent: number;
  images: string[];
  status: 'pending' | 'active';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface QuotationCreationAttributes
  extends Optional<
    QuotationAttributes,
    | 'id'
    | 'quotationModelId'
    | 'woodId'
    | 'polishId'
    | 'fabricId'
    | 'length'
    | 'width'
    | 'height'
    | 'description'
    | 'defaultDiscount'
    | 'gstPercent'
    | 'images'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class Quotation
  extends Model<QuotationAttributes, QuotationCreationAttributes>
  implements QuotationAttributes
{
  public id!: string;
  public name!: string;
  public partCode!: string;
  public categoryId!: string;
  public quotationTypeId!: string;
  public quotationModelId!: string | null;
  public woodId!: string | null;
  public polishId!: string | null;
  public fabricId!: string | null;
  public length!: number;
  public width!: number;
  public height!: number;
  public description!: string;
  public basePrice!: number;
  public defaultDiscount!: number;
  public gstPercent!: number;
  public images!: string[];
  public status!: 'pending' | 'active';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Quotation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    partCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'part_code',
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id',
    },
    quotationTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'quotation_type_id',
    },
    quotationModelId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'quotation_model_id',
    },
    woodId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'wood_id',
    },
    polishId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'polish_id',
    },
    fabricId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'fabric_id',
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    basePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'base_price',
    },
    defaultDiscount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'default_discount',
    },
    gstPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18,
      field: 'gst_percent',
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('pending', 'active'),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'quotations',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default Quotation;