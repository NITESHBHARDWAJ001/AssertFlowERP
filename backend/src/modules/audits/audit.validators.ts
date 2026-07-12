import { z } from "zod";
import { AuditItemStatus } from "@prisma/client";

export const createAuditCycleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  auditorId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
});

export const verifyItemSchema = z.object({
  status: z.enum([AuditItemStatus.VERIFIED, AuditItemStatus.MISSING, AuditItemStatus.DAMAGED]),
  notes: z.string().max(1000).optional(),
});

export const cycleIdParamSchema = z.object({
  id: z.string().min(1),
});

export const itemIdParamSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});
