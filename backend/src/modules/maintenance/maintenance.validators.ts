import { z } from "zod";
import { MaintenancePriority } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(MaintenancePriority).default(MaintenancePriority.MEDIUM),
});

export const decisionSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().min(1),
});

export const resolveSchema = z.object({
  resolution: z.string().min(1).max(2000),
});

export const maintenanceIdParamSchema = z.object({
  id: z.string().min(1),
});
