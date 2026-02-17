// src/models/Wood.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface WoodAttributes {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface WoodCreationAttributes extends Optional<WoodAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Wood extends Model<WoodAttributes, WoodCreationAttributes> implements WoodAttributes {
  public id!: string;
  public name!: string;
  public status!: 'pending' | 'active';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Wood.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'active'), allowNull: false, defaultValue: 'pending' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, field: 'deleted_at' },
  },
  { sequelize, tableName: 'woods', timestamps: true, paranoid: true, underscored: true }
);

export default Wood;