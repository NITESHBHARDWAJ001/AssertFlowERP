import { z } from "zod";
import { ResourceType } from "@prisma/client";

export const createResourceSchema = z.object({
  name: z.string().min(1).max(150),
  type: z.nativeEnum(ResourceType),
  location: z.string().max(150).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const resourceIdParamSchema = z.object({
  id: z.string().min(1),
});
