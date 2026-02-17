import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface CategoryAttributes {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CategoryCreationAttributes
  extends Optional<CategoryAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: string;
  public name!: string;
  public status!: 'pending' | 'active';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Category.init(
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
    tableName: 'categories',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default Category;