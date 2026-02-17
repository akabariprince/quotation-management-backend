import { z } from 'zod';

export const createQuotationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Quotation name is required').max(255),
    partCode: z.string().min(1, 'Part code is required').max(50),
    categoryId: z.string().uuid('Invalid category ID'),
    quotationTypeId: z.string().uuid('Invalid quotation type ID'),
    quotationModelId: z
      .string()
      .uuid('Invalid quotation model ID')
      .nullish()
      .or(z.literal('')),
    woodId: z.string().uuid('Invalid wood ID').nullish().or(z.literal('')),
    polishId: z.string().uuid('Invalid polish ID').nullish().or(z.literal('')),
    fabricId: z.string().uuid('Invalid fabric ID').nullish().or(z.literal('')),
    length: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .default(0),
    width: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .default(0),
    height: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .default(0),
    description: z.string().optional().default(''),
    basePrice: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0, 'Base price must be non-negative')),
    defaultDiscount: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .default(0),
    gstPercent: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .default(18),
    existingImages: z.string().optional(),
    status: z.enum(['pending', 'active']).default('pending'),
  }),
});

export const updateQuotationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    partCode: z.string().min(1).max(50).optional(),
    categoryId: z.string().uuid().optional(),
    quotationTypeId: z.string().uuid().optional(),
    quotationModelId: z
      .string()
      .uuid()
      .nullish()
      .or(z.literal(''))
      .optional(),
    woodId: z.string().uuid().nullish().or(z.literal('')).optional(),
    polishId: z.string().uuid().nullish().or(z.literal('')).optional(),
    fabricId: z.string().uuid().nullish().or(z.literal('')).optional(),
    length: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    width: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    height: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    description: z.string().optional(),
    basePrice: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0))
      .optional(),
    defaultDiscount: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .optional(),
    gstPercent: z
      .union([z.string(), z.number()])
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .optional(),
    existingImages: z.string().optional(),
    status: z.enum(['pending', 'active']).optional(),
  }),
});