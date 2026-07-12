import { z } from "zod";

const customFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "date", "boolean"]),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  customFieldsSchema: z.array(customFieldSchema).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
  id: z.string().min(1),
});
