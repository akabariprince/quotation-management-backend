import { z } from 'zod';

export const createFabricSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Fabric name is required').max(100),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updateFabricSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});