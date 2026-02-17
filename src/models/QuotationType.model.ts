import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface QuotationTypeAttributes {
  id: string;
  name: string;
  categoryId: string;
  status: 'pending' | 'active';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface QuotationTypeCreationAttributes
  extends Optional<
    QuotationTypeAttributes,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

class QuotationType
  extends Model<QuotationTypeAttributes, QuotationTypeCreationAttributes>
  implements QuotationTypeAttributes
{
  public id!: string;
  public name!: string;
  public categoryId!: string;
  public status!: 'pending' | 'active';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

QuotationType.init(
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
      field: 'category_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active'),
      allowNull: false,
      defaultValue: 'pending',
    },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, field: 'deleted_at' },
  },
  {
    sequelize,
    tableName: 'quotation_types',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default QuotationType;