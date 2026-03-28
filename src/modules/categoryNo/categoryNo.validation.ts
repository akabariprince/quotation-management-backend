import { z } from 'zod';

export const createCategoryNoSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category No name is required').max(100),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updateCategoryNoSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});