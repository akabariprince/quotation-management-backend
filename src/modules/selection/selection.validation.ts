import { z } from "zod";

const categorySchema = z.enum([
  "wood",
  "fabric",
  "leather",
  "leather-rite",
  "metal",
  "glass",
  "stone",
  "polish",
  "paint",
]);

const selectionValueSchema = z.object({
  name: z.string().min(1, "Selection value is required").max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const createSelectionSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Selection name is required").max(100),
      category: categorySchema,
      type: z.enum(["variant-connected", "general"]),
      variantIds: z.array(z.string().uuid()).optional().default([]),
      values: z.array(selectionValueSchema).optional(),
      status: z.enum(["pending", "active"]).default("pending").optional(),
    })
    .refine(
      (data) => data.type === "general" || (data.variantIds?.length || 0) > 0,
      {
        message: "Selection Master requires at least one mapped variant",
        path: ["variantIds"],
      },
    ),
});

export const updateSelectionSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      category: categorySchema.optional(),
      type: z.enum(["variant-connected", "general"]).optional(),
      variantIds: z.array(z.string().uuid()).optional(),
      values: z.array(selectionValueSchema).optional(),
      status: z.enum(["pending", "active"]).optional(),
    })
    .refine(
      (data) =>
        data.type !== "variant-connected" ||
        data.variantIds === undefined ||
        data.variantIds.length > 0,
      {
        message: "Selection Master requires at least one mapped variant",
        path: ["variantIds"],
      },
    ),
});
