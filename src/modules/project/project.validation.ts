import { z } from "zod";

const numField = z.union([z.number(), z.string()]).transform(Number);
const numFieldDefault0 = numField.default(0);

const projectItemSchema = z.object({
  quotationId: z.string().uuid(),
  quotationCode: z.string(),
  quotationName: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  woodId: z.string().uuid().nullable().optional(),
  woodName: z.string().nullable().optional(),
  polishId: z.string().uuid().nullable().optional(),
  polishName: z.string().nullable().optional(),
  fabricId: z.string().uuid().nullable().optional(),
  fabricName: z.string().nullable().optional(),
  basePrice: numField,
  discountPercent: numFieldDefault0,
  discountAmount: numFieldDefault0,
  finalPrice: numField,
  quantity: z.union([z.number(), z.string()]).transform(Number).default(1),
  total: numField,
  gstPercent: z.union([z.number(), z.string()]).transform(Number).default(18),
  igst: numFieldDefault0,
  cgst: numFieldDefault0,
  sgst: numFieldDefault0,
  totalWithGst: numField,
  notes: z.array(z.string()).optional().default([]),
  specialNote: z.string().optional(),
});

// Schema WITHOUT body wrapper
const createProjectBody = z.object({
  date: z.string(),
  customerId: z.string().uuid(),
  salesPersonId: z.string().uuid().nullable().optional(),
  subtotal: numFieldDefault0,
  totalDiscount: numFieldDefault0,
  igst: numFieldDefault0,
  cgst: numFieldDefault0,
  sgst: numFieldDefault0,
  grandTotal: numFieldDefault0,
  grandTotalWithGst: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => Number(v) || 0)
    .default(0),
  projectName: z.string().max(255).optional(),
  deliveryAddress: z.string().optional(),
  deliveryLandmark: z.string().max(255).optional(),
  deliveryCity: z.string().max(100).optional(),
  deliveryState: z.string().max(100).optional(),
  deliveryPincode: z.string().max(10).optional(),
  status: z.enum(["draft", "sent", "approved", "expired"]).default("draft"),
  items: z.array(projectItemSchema).min(1, "At least one item is required"),
});

const updateProjectBody = z.object({
  date: z.string().optional(),
  customerId: z.string().uuid().optional(),
  salesPersonId: z.string().uuid().nullable().optional(),
  subtotal: z.union([z.number(), z.string()]).transform(Number).optional(),
  totalDiscount: z.union([z.number(), z.string()]).transform(Number).optional(),
  igst: z.union([z.number(), z.string()]).transform(Number).optional(),
  cgst: z.union([z.number(), z.string()]).transform(Number).optional(),
  sgst: z.union([z.number(), z.string()]).transform(Number).optional(),
  grandTotal: z.union([z.number(), z.string()]).transform(Number).optional(),
  grandTotalWithGst: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => Number(v) || 0)
    .optional(),
  status: z.enum(["draft", "sent", "approved", "expired"]).optional(),
  items: z.array(projectItemSchema).optional(),
});

const updateStatusBody = z.object({
  status: z.enum(["draft", "sent", "approved", "expired"]),
});

// Export BOTH formats
export const createProjectSchema = z.object({ body: createProjectBody });
export const updateProjectSchema = z.object({ body: updateProjectBody });
export const updateProjectStatusSchema = z.object({ body: updateStatusBody });

// Also export raw body schemas
export const createProjectBodySchema = createProjectBody;
export const updateProjectBodySchema = updateProjectBody;
export const updateProjectStatusBodySchema = updateStatusBody;
