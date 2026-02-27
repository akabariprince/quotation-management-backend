// src/models/Customer.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface CustomerAttributes {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  landmark: string | null;
  gstin: string | null;
  contactPerson: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  pincode: string | null;
  deliveryAddress: string | null;
  deliveryLandmark: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;
  deliverySameAsBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CustomerCreationAttributes
  extends Optional<
    CustomerAttributes,
    | "id"
    | "email"
    | "address"
    | "landmark"
    | "gstin"
    | "contactPerson"
    | "city"
    | "state"
    | "region"
    | "pincode"
    | "deliveryAddress"
    | "deliveryLandmark"
    | "deliveryCity"
    | "deliveryState"
    | "deliveryPincode"
    | "deliverySameAsBilling"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  public id!: string;
  public name!: string;
  public mobile!: string;
  public email!: string | null;
  public address!: string | null;
  public landmark!: string | null;
  public gstin!: string | null;
  public contactPerson!: string | null;
  public city!: string | null;
  public state!: string | null;
  public region!: string | null;
  public pincode!: string | null;
  public deliveryAddress!: string | null;
  public deliveryLandmark!: string | null;
  public deliveryCity!: string | null;
  public deliveryState!: string | null;
  public deliveryPincode!: string | null;
  public deliverySameAsBilling!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Customer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    mobile: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    landmark: { type: DataTypes.STRING(255), allowNull: true },
    gstin: { type: DataTypes.STRING(15), allowNull: true },
    contactPerson: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "contact_person",
    },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    region: { type: DataTypes.STRING(50), allowNull: true },
    pincode: { type: DataTypes.STRING(10), allowNull: true },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "delivery_address",
    },
    deliveryLandmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "delivery_landmark",
    },
    deliveryCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "delivery_city",
    },
    deliveryState: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "delivery_state",
    },
    deliveryPincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "delivery_pincode",
    },
    deliverySameAsBilling: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "delivery_same_as_billing",
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
    deletedAt: { type: DataTypes.DATE, field: "deleted_at" },
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    paranoid: true,
    underscored: true,
  },
);

export default Customer;