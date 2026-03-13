import { Model, DataTypes } from "sequelize";
import sequelize from "../config/sequelize";

class Setting extends Model {
  public id!: string;
  public key!: string;
  public value!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Setting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Setting",
    tableName: "settings",
    timestamps: true,
  }
);

export default Setting;
