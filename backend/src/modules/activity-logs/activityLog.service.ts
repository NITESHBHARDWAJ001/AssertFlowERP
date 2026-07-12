import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

interface RecordActivityInput {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export async function recordActivity(input: RecordActivityInput) {
  await prisma.activityLog.create({
    data: {
      organizationId: input.organizationId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listActivity(organizationId: string, take = 50) {
  return prisma.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
