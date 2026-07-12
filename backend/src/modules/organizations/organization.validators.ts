import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(slugRegex, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  plan: z.string().min(1).default("free"),
  admin: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(8),
  }),
});

export const orgIdParamSchema = z.object({
  id: z.string().min(1),
});
