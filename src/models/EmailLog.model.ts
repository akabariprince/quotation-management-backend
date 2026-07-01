// src/models/EmailLog.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface EmailLogAttributes {
  id: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  toEmail: string | null;
  toPhone: string | null;
  subject: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  status: 'queued' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  providerMessageId: string | null;
  providerStatus: string | null;
  requestPayload: any | null;
  responsePayload: any | null;
  errorMessage: string | null;
  sentBy: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailLogCreationAttributes extends Optional<EmailLogAttributes, 'id' | 'toEmail' | 'toPhone' | 'referenceId' | 'referenceType' | 'providerMessageId' | 'providerStatus' | 'requestPayload' | 'responsePayload' | 'errorMessage' | 'sentBy' | 'sentAt' | 'deliveredAt' | 'readAt' | 'failedAt' | 'createdAt' | 'updatedAt'> {}

class EmailLog extends Model<EmailLogAttributes, EmailLogCreationAttributes> implements EmailLogAttributes {
  public id!: string;
  public channel!: 'email' | 'whatsapp';
  public recipient!: string;
  public toEmail!: string | null;
  public toPhone!: string | null;
  public subject!: string;
  public type!: string;
  public referenceId!: string | null;
  public referenceType!: string | null;
  public status!: 'queued' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  public providerMessageId!: string | null;
  public providerStatus!: string | null;
  public requestPayload!: any | null;
  public responsePayload!: any | null;
  public errorMessage!: string | null;
  public sentBy!: string | null;
  public sentAt!: Date | null;
  public deliveredAt!: Date | null;
  public readAt!: Date | null;
  public failedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

EmailLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'email' },
    recipient: { type: DataTypes.STRING(255), allowNull: false },
    toEmail: { type: DataTypes.STRING(255), allowNull: true, field: 'to_email' },
    toPhone: { type: DataTypes.STRING(32), allowNull: true, field: 'to_phone' },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    referenceId: { type: DataTypes.UUID, allowNull: true, field: 'reference_id' },
    referenceType: { type: DataTypes.STRING(50), allowNull: true, field: 'reference_type' },
    status: { type: DataTypes.STRING(20), allowNull: false },
    providerMessageId: { type: DataTypes.STRING(255), allowNull: true, field: 'provider_message_id' },
    providerStatus: { type: DataTypes.STRING(50), allowNull: true, field: 'provider_status' },
    requestPayload: { type: DataTypes.JSONB, allowNull: true, field: 'request_payload' },
    responsePayload: { type: DataTypes.JSONB, allowNull: true, field: 'response_payload' },
    errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
    sentBy: { type: DataTypes.UUID, allowNull: true, field: 'sent_by' },
    sentAt: { type: DataTypes.DATE, allowNull: true, field: 'sent_at' },
    deliveredAt: { type: DataTypes.DATE, allowNull: true, field: 'delivered_at' },
    readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
    failedAt: { type: DataTypes.DATE, allowNull: true, field: 'failed_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  { sequelize, tableName: 'email_logs', timestamps: true, underscored: true }
);

export default EmailLog;
