import { z } from 'zod';

export const createQuotationTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Type name is required').max(100),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updateQuotationTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});