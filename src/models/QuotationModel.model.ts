import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface QuotationModelAttributes {
  id: string;
  name: string;
  quotationTypeId: string;
  status: 'pending' | 'active';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface QuotationModelCreationAttributes
  extends Optional<
    QuotationModelAttributes,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

class QuotationModel
  extends Model<QuotationModelAttributes, QuotationModelCreationAttributes>
  implements QuotationModelAttributes
{
  public id!: string;
  public name!: string;
  public quotationTypeId!: string;
  public status!: 'pending' | 'active';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

QuotationModel.init(
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
    quotationTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'quotation_type_id',
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
    tableName: 'quotation_models',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default QuotationModel;