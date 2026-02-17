// src/models/EmailLog.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface EmailLogAttributes {
  id: string;
  toEmail: string;
  subject: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  status: 'sent' | 'failed';
  errorMessage: string | null;
  sentBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailLogCreationAttributes extends Optional<EmailLogAttributes, 'id' | 'referenceId' | 'referenceType' | 'errorMessage' | 'sentBy' | 'createdAt' | 'updatedAt'> {}

class EmailLog extends Model<EmailLogAttributes, EmailLogCreationAttributes> implements EmailLogAttributes {
  public id!: string;
  public toEmail!: string;
  public subject!: string;
  public type!: string;
  public referenceId!: string | null;
  public referenceType!: string | null;
  public status!: 'sent' | 'failed';
  public errorMessage!: string | null;
  public sentBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

EmailLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    toEmail: { type: DataTypes.STRING(255), allowNull: false, field: 'to_email' },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    referenceId: { type: DataTypes.UUID, allowNull: true, field: 'reference_id' },
    referenceType: { type: DataTypes.STRING(50), allowNull: true, field: 'reference_type' },
    status: { type: DataTypes.ENUM('sent', 'failed'), allowNull: false },
    errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
    sentBy: { type: DataTypes.UUID, allowNull: true, field: 'sent_by' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  { sequelize, tableName: 'email_logs', timestamps: true, underscored: true }
);

export default EmailLog;