import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface ProjectItemAttributes {
  id: string;
  projectId: string;
  quotationId: string;
  quotationCode: string;
  quotationName: string;
  description?: string | null;
  images?: string[];
  
  // ✅ FULLY DYNAMIC - No hardcoded types
  selections?: Array<{
    selectionId: string;      // Reference to Selection master
    selectionName: string;    // e.g., "Wood Type", "Fabric Quality"
    selectionCode: string;    // e.g., "wood-type", "fabric-quality"
    values: Array<{           // Support multiple values per selection
      id?: string;            // If it's from dropdown options
      label?: string;         // Display name
      value: string;          // Actual value (text/color/number)
    }>;
  }> | null;
  
  selectedVariantId?: string | null;
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
  notes?: string[];
  specialNote?: string | null;
  projectQuotationNo: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

interface ProjectItemCreationAttributes
  extends Optional<ProjectItemAttributes, "id" | "createdAt" | "updatedAt"> {}

class ProjectItem
  extends Model<ProjectItemAttributes, ProjectItemCreationAttributes>
  implements ProjectItemAttributes
{
  public id!: string;
  public projectId!: string;
  public quotationId!: string;
  public quotationCode!: string;
  public quotationName!: string;
  public description?: string | null;
  public images?: string[];
  
  public selections?: Array<{
    selectionId: string;
    selectionName: string;
    selectionCode: string;
    values: Array<{
      id?: string;
      label?: string;
      value: string;
    }>;
  }> | null;
  
  public selectedVariantId?: string | null;
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
  public notes?: string[];
  public specialNote?: string | null;
  public projectQuotationNo!: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;
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
      references: { model: "projects", key: "id" },
      onDelete: "CASCADE",
    },
    quotationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quotationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quotationName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    
    // ✅ Store selections as JSONB array
    selections: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: "Dynamic selections based on Selection master",
    },
    
    selectedVariantId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    basePrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    finalPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gstPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18,
    },
    igst: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cgst: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sgst: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalWithGst: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    specialNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectQuotationNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "project_items",
    paranoid: true,
    timestamps: true,
    underscored: true,
  }
);

export default ProjectItem;