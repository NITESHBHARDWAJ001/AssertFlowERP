import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  assetTagPrefix: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Prefix must be uppercase letters/numbers only")
    .optional(),
  logoUrl: z.string().url().max(500).optional(),
  bookingRequiresApproval: z.boolean().optional(),
  maintenanceRequiresApproval: z.boolean().optional(),
});
