// src/models/OTPLog.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface OTPLogAttributes {
  id: string;
  type: 'login' | 'discount' | 'master_activation';
  entityId: string | null;
  entityType: string | null;
  email: string;
  otpHash: string;
  requestedBy: string | null;
  approvedBy: string | null;
  status: 'pending' | 'approved' | 'expired';
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OTPLogCreationAttributes extends Optional<OTPLogAttributes, 'id' | 'entityId' | 'entityType' | 'requestedBy' | 'approvedBy' | 'status' | 'attempts' | 'maxAttempts' | 'approvedAt' | 'createdAt' | 'updatedAt'> {}

class OTPLog extends Model<OTPLogAttributes, OTPLogCreationAttributes> implements OTPLogAttributes {
  public id!: string;
  public type!: 'login' | 'discount' | 'master_activation';
  public entityId!: string | null;
  public entityType!: string | null;
  public email!: string;
  public otpHash!: string;
  public requestedBy!: string | null;
  public approvedBy!: string | null;
  public status!: 'pending' | 'approved' | 'expired';
  public attempts!: number;
  public maxAttempts!: number;
  public expiresAt!: Date;
  public approvedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

OTPLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.ENUM('login', 'discount', 'master_activation'), allowNull: false },
    entityId: { type: DataTypes.STRING(255), allowNull: true, field: 'entity_id' },
    entityType: { type: DataTypes.STRING(100), allowNull: true, field: 'entity_type' },
    email: { type: DataTypes.STRING(255), allowNull: false },
    otpHash: { type: DataTypes.STRING(255), allowNull: false, field: 'otp_hash' },
    requestedBy: { type: DataTypes.UUID, allowNull: true, field: 'requested_by' },
    approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
    status: { type: DataTypes.ENUM('pending', 'approved', 'expired'), allowNull: false, defaultValue: 'pending' },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maxAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3, field: 'max_attempts' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  { sequelize, tableName: 'otp_logs', timestamps: true, underscored: true }
);

export default OTPLog;