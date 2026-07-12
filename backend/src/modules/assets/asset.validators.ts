import { z } from "zod";
import { AssetStatus } from "@prisma/client";

export const createAssetSchema = z.object({
  name: z.string().min(1).max(150),
  categoryId: z.string().min(1),
  serialNumber: z.string().max(150).optional(),
  vendor: z.string().max(150).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchaseCost: z.coerce.number().nonnegative().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  currentDepartmentId: z.string().min(1).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  categoryId: z.string().min(1).optional(),
  serialNumber: z.string().max(150).optional(),
  vendor: z.string().max(150).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchaseCost: z.coerce.number().nonnegative().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const transitionStatusSchema = z.object({
  toStatus: z.nativeEnum(AssetStatus),
  note: z.string().max(1000).optional(),
  toHolderId: z.string().min(1).optional(),
  toDepartmentId: z.string().min(1).optional(),
});

export const assetIdParamSchema = z.object({
  id: z.string().min(1),
});

export const returnAssetSchema = z.object({
  condition: z.string().max(1000).optional(),
});

export const listAssetsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  departmentId: z.string().optional(),
});
