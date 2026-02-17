import { z } from 'zod';

const customerBody = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  mobile: z.string().min(10, 'Valid mobile is required').max(20),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().max(15).optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  region: z.string().max(50).optional().nullable(),
});

export const createCustomerSchema = z.object({ body: customerBody });
export const updateCustomerSchema = z.object({ body: customerBody.partial() });