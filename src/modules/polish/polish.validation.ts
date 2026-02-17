import { z } from 'zod';

export const createPolishSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Polish name is required').max(100),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updatePolishSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});