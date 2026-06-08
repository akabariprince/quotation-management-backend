import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface PdfPrintLogAttributes {
  id: string;
  projectId: string;
  projectNo: string;
  projectName: string | null;
  fileName: string;
  filePath: string;
  uniqueNo: string;
  generatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PdfPrintLogCreationAttributes
  extends Optional<
    PdfPrintLogAttributes,
    | "id"
    | "projectName"
    | "generatedBy"
    | "createdAt"
    | "updatedAt"
  > {}

class PdfPrintLog
  extends Model<PdfPrintLogAttributes, PdfPrintLogCreationAttributes>
  implements PdfPrintLogAttributes
{
  public id!: string;
  public projectId!: string;
  public projectNo!: string;
  public projectName!: string | null;
  public fileName!: string;
  public filePath!: string;
  public uniqueNo!: string;
  public generatedBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

PdfPrintLog.init(
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
    projectNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "project_no",
    },
    projectName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "project_name",
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "file_name",
    },
    filePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "file_path",
    },
    uniqueNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "unique_no",
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "generated_by",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "pdf_print_logs",
    timestamps: true,
    underscored: true,
  },
);

export default PdfPrintLog;
