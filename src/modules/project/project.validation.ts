import { z } from "zod";

const numField = z.union([z.number(), z.string()]).transform(Number);
const numFieldDefault0 = numField.default(0);

// ✅ Selection value schema
const selectionValueSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.string(),
});

// ✅ Selection schema
const selectionSchema = z.object({
  selectionId: z.string().uuid(),
  selectionName: z.string(),
  selectionCode: z.string(),
  values: z.array(selectionValueSchema).min(1),
});

// ✅ Project item schema
const projectItemSchema = z.object({
  quotationId: z.string().uuid(),
  quotationCode: z.string(),
  quotationName: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  selections: z.array(selectionSchema).optional().nullable(),
  selectedVariantId: z.string().uuid().nullable().optional(),
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
  specialNote: z.string().nullable().optional(),
});

// ✅ Create project body schema
const createProjectBody = z.object({
  projectNo: z.string().optional(), // ← Allow frontend to pass custom projectNo
  date: z.string(),
  customerId: z.string().uuid(),
  salesPersonId: z.string().uuid().nullable().optional(),
  subtotal: numFieldDefault0,
  totalDiscount: numFieldDefault0,
  igst: numFieldDefault0,
  cgst: numFieldDefault0,
  sgst: numFieldDefault0,
  grandTotal: numFieldDefault0,
  grandTotalWithGst: numFieldDefault0,
  projectName: z.string().max(255).optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryLandmark: z.string().max(255).nullable().optional(),
  deliveryCity: z.string().max(100).nullable().optional(),
  deliveryState: z.string().max(100).nullable().optional(),
  deliveryPincode: z.string().max(10).nullable().optional(),
  status: z.enum(["draft", "sent", "approved", "expired"]).default("draft"),
  items: z.array(projectItemSchema).min(1, "At least one item is required"),
});

// ✅ Update project body schema (all fields optional)
const updateProjectBody = createProjectBody.partial();

// ✅ Update status body schema
const updateStatusBody = z.object({
  status: z.enum(["draft", "sent", "approved", "expired"]),
});

// ✅ Export wrapped schemas (for validation middleware)
export const createProjectSchema = z.object({ 
  body: createProjectBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProjectSchema = z.object({ 
  body: updateProjectBody,
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const updateProjectStatusSchema = z.object({ 
  body: updateStatusBody,
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

// ✅ Also export raw body schemas (for direct use)
export const createProjectBodySchema = createProjectBody;
export const updateProjectBodySchema = updateProjectBody;
export const updateProjectStatusBodySchema = updateStatusBody;