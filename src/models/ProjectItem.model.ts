import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface ProjectItemAttributes {
  id: string;
  projectId: string;
  projectQuotationNo: string;
  quotationId: string;
  quotationCode: string;
  quotationName: string;
  description: string | null;
  specialNote: string | null;
  images: string[];
  woodId: string | null;
  woodName: string | null;
  polishId: string | null;
  polishName: string | null;
  fabricId: string | null;
  fabricName: string | null;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  total: number;
  gstPercent: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalWithGst: number;
  notes: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectItemCreationAttributes extends Optional<
  ProjectItemAttributes,
  | "id"
  | "projectQuotationNo"
  | "description"
  | "specialNote"
  | "images"
  | "woodId"
  | "woodName"
  | "polishId"
  | "polishName"
  | "fabricId"
  | "fabricName"
  | "discountPercent"
  | "discountAmount"
  | "igst"
  | "cgst"
  | "sgst"
  | "notes"
  | "sortOrder"
  | "createdAt"
  | "updatedAt"
> {}

class ProjectItem
  extends Model<ProjectItemAttributes, ProjectItemCreationAttributes>
  implements ProjectItemAttributes
{
  public id!: string;
  public projectId!: string;
  public projectQuotationNo!: string;
  public quotationId!: string;
  public quotationCode!: string;
  public quotationName!: string;
  public description!: string | null;
  public specialNote!: string | null;
  public images!: string[];
  public woodId!: string | null;
  public woodName!: string | null;
  public polishId!: string | null;
  public polishName!: string | null;
  public fabricId!: string | null;
  public fabricName!: string | null;
  public basePrice!: number;
  public discountPercent!: number;
  public discountAmount!: number;
  public finalPrice!: number;
  public quantity!: number;
  public total!: number;
  public gstPercent!: number;
  public igst!: number;
  public cgst!: number;
  public sgst!: number;
  public totalWithGst!: number;
  public notes!: string[];
  public sortOrder!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ProjectItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "project_id",
    },
    projectQuotationNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "project_quotation_no",
    },
    quotationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "quotation_id",
    },
    quotationCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "quotation_code",
    },
    quotationName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "quotation_name",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    specialNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "special_note",
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    woodId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "wood_id",
    },
    woodName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "wood_name",
    },
    polishId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "polish_id",
    },
    polishName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "polish_name",
    },
    fabricId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "fabric_id",
    },
    fabricName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "fabric_name",
    },
    basePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "base_price",
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_percent",
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_amount",
    },
    finalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "final_price",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    gstPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18,
      field: "gst_percent",
    },
    igst: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cgst: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sgst: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalWithGst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      field: "total_with_gst",
    },
    notes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
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
    tableName: "project_items",
    timestamps: true,
    underscored: true,
  },
);

export default ProjectItem;
