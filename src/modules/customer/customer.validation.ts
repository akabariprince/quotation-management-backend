import { z } from "zod";

const customerBody = z.object({
  name: z.string().min(1, "Name is required").max(150),
  mobile: z.string().min(10, "Valid mobile is required").max(20),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().max(15).optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  region: z.string().max(50).optional().nullable(),
  landmark: z.string().max(255).nullable().optional(),
  pincode: z.string().max(10).nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryLandmark: z.string().max(255).nullable().optional(),
  deliveryCity: z.string().max(100).nullable().optional(),
  deliveryState: z.string().max(100).nullable().optional(),
  deliveryPincode: z.string().max(10).nullable().optional(),
  deliverySameAsBilling: z.boolean().optional(),
});

export const createCustomerSchema = z.object({ body: customerBody });
export const updateCustomerSchema = z.object({ body: customerBody.partial() });
