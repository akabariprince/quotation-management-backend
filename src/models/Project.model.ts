import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface ProjectAttributes {
  id: string;
  projectNo: string;
  date: string;
  customerId: string;
  salesPersonId: string;
  subtotal: number;
  totalDiscount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  grandTotalWithGst: number;
  status: 'draft' | 'sent' | 'approved' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProjectCreationAttributes
  extends Optional<
    ProjectAttributes,
    | 'id'
    | 'subtotal'
    | 'totalDiscount'
    | 'igst'
    | 'cgst'
    | 'sgst'
    | 'grandTotal'
    | 'grandTotalWithGst'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: string;
  public projectNo!: string;
  public date!: string;
  public customerId!: string;
  public salesPersonId!: string;
  public subtotal!: number;
  public totalDiscount!: number;
  public igst!: number;
  public cgst!: number;
  public sgst!: number;
  public grandTotal!: number;
  public grandTotalWithGst!: number;
  public status!: 'draft' | 'sent' | 'approved' | 'expired';
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
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
      field: 'project_no',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id',
    },
    salesPersonId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'sales_person_id',
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
      field: 'total_discount',
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
      field: 'grand_total',
    },
    grandTotalWithGst: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'grand_total_with_gst',
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'approved', 'expired'),
      allowNull: false,
      defaultValue: 'draft',
    },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, field: 'deleted_at' },
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default Project;