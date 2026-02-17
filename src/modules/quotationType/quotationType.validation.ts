import { z } from 'zod';

export const createQuotationTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Quotation type name is required').max(100),
    categoryId: z.string().uuid('Invalid category ID'),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updateQuotationTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    categoryId: z.string().uuid().optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});