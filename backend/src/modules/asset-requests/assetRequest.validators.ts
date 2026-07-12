import { z } from "zod";

export const createRequestSchema = z.object({
  categoryId: z.string().min(1),
  reason: z.string().max(1000).optional(),
  expectedReturnDate: z.coerce.date().optional(),
});

export const decisionSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(1000).optional(),
});

export const managerDecisionSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(1000).optional(),
  assetId: z.string().min(1).optional(),
});

export const requestIdParamSchema = z.object({
  id: z.string().min(1),
});
