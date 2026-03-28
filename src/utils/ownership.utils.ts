// src/utils/ownership.utils.ts
import { AuthUser } from '../types/express';
import { PERMISSIONS } from './permissions';

/**
 * Check if the user can manage ALL customers (bypass ownership).
 * Uses the permission system — not role name checks.
 */
export function canManageAllCustomers(user?: AuthUser | null): boolean {
  if (!user?.role?.permissions) return false;
  return user.role.permissions.includes(PERMISSIONS.CUSTOMER_MANAGE_ALL);
}