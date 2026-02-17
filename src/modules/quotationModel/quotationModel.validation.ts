import { z } from 'zod';

export const createQuotationModelSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Quotation model name is required').max(100),
    quotationTypeId: z.string().uuid('Invalid quotation type ID'),
    status: z.enum(['pending', 'active']).default('pending').optional(),
  }),
});

export const updateQuotationModelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    quotationTypeId: z.string().uuid().optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});