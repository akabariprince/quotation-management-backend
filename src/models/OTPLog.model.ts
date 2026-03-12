// src/models/OTPLog.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface OTPLogAttributes {
  id: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  entityName: string | null;
  email: string;
  otpHash: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OTPLogCreationAttributes extends Optional<
  OTPLogAttributes,
  | "id"
  | "entityId"
  | "entityType"
  | "entityName"
  | "status"
  | "attempts"
  | "maxAttempts"
  | "requestedBy"
  | "approvedBy"
  | "approvedAt"
  | "createdAt"
  | "updatedAt"
> { }

class OTPLog
  extends Model<OTPLogAttributes, OTPLogCreationAttributes>
  implements OTPLogAttributes {
  public id!: string;
  public type!: string;
  public entityId!: string | null;
  public entityType!: string | null;
  public entityName!: string | null;
  public email!: string;
  public otpHash!: string;
  public status!: string;
  public attempts!: number;
  public maxAttempts!: number;
  public expiresAt!: Date;
  public requestedBy!: string | null;
  public approvedBy!: string | null;
  public approvedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public requester?: any;
  public approver?: any;
}

OTPLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.STRING(255), // ✅ STRING — matches existing DB column
      allowNull: true,
      field: "entity_id",
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "entity_type",
    },
    entityName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "entity_name",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "otp_hash",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: "max_attempts",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    requestedBy: {
      type: DataTypes.STRING(255), // ✅ STRING — avoids UUID cast issues
      allowNull: true,
      field: "requested_by",
    },
    approvedBy: {
      type: DataTypes.STRING(255), // ✅ STRING — avoids UUID cast issues
      allowNull: true,
      field: "approved_by",
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "otp_logs",
    timestamps: true,
    underscored: true,
  },
);

export default OTPLog;
