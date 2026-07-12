import { z } from "zod";

export const createTransferRequestSchema = z.object({
  assetId: z.string().min(1),
  toHolderId: z.string().min(1).optional(),
  reason: z.string().max(1000).optional(),
});

export const decisionSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(1000).optional(),
});

export const transferRequestIdParamSchema = z.object({
  id: z.string().min(1),
});
