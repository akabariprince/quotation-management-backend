// src/modules/role/role.validation.ts
import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50)
    .regex(/^[a-z_]+$/, 'Lowercase letters and underscores only'),
  displayName: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  isActive: z.boolean().optional().default(true),
});

export const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});