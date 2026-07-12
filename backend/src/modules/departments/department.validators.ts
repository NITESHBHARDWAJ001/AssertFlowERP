import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(120),
  parentDepartmentId: z.string().min(1).optional(),
  headUserId: z.string().min(1).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentIdParamSchema = z.object({
  id: z.string().min(1),
});
