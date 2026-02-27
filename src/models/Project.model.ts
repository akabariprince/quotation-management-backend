import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

export interface ProjectAttributes {
  id: string;
  projectNo: string;
  date: string;

  customerId: string;
  salesPersonId: string | null;

  subtotal: string;
  totalDiscount: string;
  igst: string;
  cgst: string;
  sgst: string;
  grandTotal: string;
  grandTotalWithGst: string;

  projectName: string | null;
  deliveryAddress: string | null;
  deliveryLandmark: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPincode: string | null;

  status: "draft" | "sent" | "approved" | "expired";

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectCreationAttributes
  extends Optional<
    ProjectAttributes,
    | "id"
    | "subtotal"
    | "totalDiscount"
    | "igst"
    | "cgst"
    | "sgst"
    | "grandTotal"
    | "grandTotalWithGst"
    | "status"
    | "projectName"
    | "deliveryAddress"
    | "deliveryLandmark"
    | "deliveryCity"
    | "deliveryState"
    | "deliveryPincode"
    | "salesPersonId"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: string;
  public projectNo!: string;
  public date!: string;

  public customerId!: string;
  public salesPersonId!: string | null;

  public subtotal!: string;
  public totalDiscount!: string;
  public igst!: string;
  public cgst!: string;
  public sgst!: string;
  public grandTotal!: string;
  public grandTotalWithGst!: string;

  public projectName!: string | null;
  public deliveryAddress!: string | null;
  public deliveryLandmark!: string | null;
  public deliveryCity!: string | null;
  public deliveryState!: string | null;
  public deliveryPincode!: string | null;

  public status!: "draft" | "sent" | "approved" | "expired";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Optional associations (define proper types if you have models)
  public items?: any[];
  public customer?: any;
  public salesPerson?: any;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    projectNo: {
      type: DataTypes.STRING(25),
      allowNull: false,
      unique: true,
      field: "project_no",
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "customer_id",
    },

    salesPersonId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "sales_person_id",
    },

    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },

    totalDiscount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_discount",
    },

    igst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },

    cgst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },

    sgst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },

    grandTotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "grand_total",
    },

    grandTotalWithGst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "grand_total_with_gst",
    },

    projectName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "project_name",
    },

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

    status: {
      type: DataTypes.ENUM("draft", "sent", "approved", "expired"),
      allowNull: false,
      defaultValue: "draft",
    },

    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },

    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },

    deletedAt: {
      type: DataTypes.DATE,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "projects",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default Project;