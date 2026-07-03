// src/models/User.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string | null;
  whatsappVerified: boolean;
  whatsappVerifiedAt: Date | null;
  whatsappVerifiedMobile: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  emailVerifiedEmail: string | null;
  roleId: string;
  isActive: boolean;
  lastLogin: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'isActive' | 'lastLogin' | 'refreshToken' |
  'createdAt' | 'updatedAt' | 'deletedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public mobile!: string | null;
  public whatsappVerified!: boolean;
  public whatsappVerifiedAt!: Date | null;
  public whatsappVerifiedMobile!: string | null;
  public emailVerified!: boolean;
  public emailVerifiedAt!: Date | null;
  public emailVerifiedEmail!: string | null;
  public roleId!: string;
  public isActive!: boolean;
  public lastLogin!: Date | null;
  public refreshToken!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  public role?: any;

  public toSafeJSON() {
    const values = this.toJSON() as any;
    delete values.password;
    delete values.refreshToken;
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  whatsappVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "whatsapp_verified",
  },
  whatsappVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "whatsapp_verified_at",
  },
  whatsappVerifiedMobile: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: "whatsapp_verified_mobile",
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "email_verified",
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "email_verified_at",
  },
  emailVerifiedEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: "email_verified_email",
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'role_id',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login',
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token',
  },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, field: 'deleted_at' },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
});

export default User;
