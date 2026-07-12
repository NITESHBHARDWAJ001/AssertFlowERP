import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";

const settingsSelect = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  assetTagPrefix: true,
  logoUrl: true,
  bookingRequiresApproval: true,
  maintenanceRequiresApproval: true,
} as const;

export async function getSettings(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: settingsSelect });
  if (!org) throw ApiError.notFound("Organization not found");
  return org;
}

interface UpdateSettingsInput {
  name?: string;
  assetTagPrefix?: string;
  logoUrl?: string;
  bookingRequiresApproval?: boolean;
  maintenanceRequiresApproval?: boolean;
}

export async function updateSettings(
  organizationId: string,
  actorUserId: string,
  input: UpdateSettingsInput,
  ipAddress?: string
) {
  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: input,
    select: settingsSelect,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_ORGANIZATION_SETTINGS",
    entityType: "Organization",
    entityId: organizationId,
    ipAddress,
    metadata: { ...input },
  });

  return updated;
}
