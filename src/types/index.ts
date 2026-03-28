// src/types/index.ts
import { Request } from 'express';

// Override the Express.User to include our custom fields
declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      roleId: string;
      roleName: string;
      permissions: string[];
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  };
}

export type EntityStatus = 'pending' | 'active';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'expired';
export type OTPType = 'login' | 'discount' | 'master_activation';
export type OTPStatus = 'pending' | 'approved' | 'expired';

export interface FilterParams {
  search?: string;
  status?: string;
  categoryId?: string;
  productTypeId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}