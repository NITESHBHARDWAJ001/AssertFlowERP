import { AssetStatus, AuditCycleStatus, AuditItemStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";
import { notify } from "../notifications/notification.service";
import { isTransitionAllowed } from "../assets/asset.stateMachine";
import type { AuthUser } from "../../middleware/authenticate";

const cycleInclude = {
  auditor: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { items: true } },
} satisfies Prisma.AuditCycleInclude;

const itemInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  verifiedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.AuditItemInclude;

export async function listCycles(organizationId: string) {
  return prisma.auditCycle.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: cycleInclude,
  });
}

export async function getCycle(organizationId: string, id: string) {
  const cycle = await prisma.auditCycle.findFirst({
    where: { id, organizationId },
    include: { ...cycleInclude, items: { include: itemInclude, orderBy: { createdAt: "asc" } } },
  });
  if (!cycle) throw ApiError.notFound("Audit cycle not found");

  const discrepancies = {
    missing: cycle.items.filter((i) => i.status === AuditItemStatus.MISSING).length,
    damaged: cycle.items.filter((i) => i.status === AuditItemStatus.DAMAGED).length,
    verified: cycle.items.filter((i) => i.status === AuditItemStatus.VERIFIED).length,
    pending: cycle.items.filter((i) => i.status === AuditItemStatus.PENDING).length,
  };

  return { ...cycle, discrepancies };
}

interface CreateCycleInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  auditorId: string;
  categoryId?: string;
  departmentId?: string;
}

export async function createCycle(
  organizationId: string,
  actorUserId: string,
  input: CreateCycleInput,
  ipAddress?: string
) {
  const auditor = await prisma.user.findFirst({ where: { id: input.auditorId, organizationId, deletedAt: null } });
  if (!auditor) throw ApiError.badRequest("Auditor does not belong to your organization");

  const assetWhere: Prisma.AssetWhereInput = {
    organizationId,
    deletedAt: null,
    status: { notIn: [AssetStatus.RETIRED, AssetStatus.DISPOSED] },
  };
  if (input.categoryId) assetWhere.categoryId = input.categoryId;
  if (input.departmentId) assetWhere.currentDepartmentId = input.departmentId;

  const assets = await prisma.asset.findMany({ where: assetWhere, select: { id: true } });
  if (assets.length === 0) {
    throw ApiError.badRequest("No active assets match the audit scope");
  }

  const cycle = await prisma.$transaction(async (tx) => {
    const created = await tx.auditCycle.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        auditorId: input.auditorId,
        createdById: actorUserId,
        status: AuditCycleStatus.IN_PROGRESS,
      },
    });

    await tx.auditItem.createMany({
      data: assets.map((a) => ({ cycleId: created.id, assetId: a.id })),
    });

    return created;
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_AUDIT_CYCLE",
    entityType: "AuditCycle",
    entityId: cycle.id,
    ipAddress,
    metadata: { name: cycle.name, assetCount: assets.length },
  });

  await notify({
    organizationId,
    userId: input.auditorId,
    type: "AUDIT_ASSIGNED",
    title: "You've been assigned an audit",
    message: `You are the auditor for "${cycle.name}" (${assets.length} assets).`,
    entityType: "AuditCycle",
    entityId: cycle.id,
  });

  return getCycle(organizationId, cycle.id);
}

function assertCanVerify(actor: AuthUser, cycleAuditorId: string) {
  const isPrivileged = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isPrivileged && actor.id !== cycleAuditorId) {
    throw ApiError.forbidden("Only the assigned auditor or a manager can verify items in this cycle");
  }
}

export async function verifyItem(
  organizationId: string,
  actor: AuthUser,
  cycleId: string,
  itemId: string,
  status: AuditItemStatus,
  notes: string | undefined,
  ipAddress?: string
) {
  const cycle = await prisma.auditCycle.findFirst({ where: { id: cycleId, organizationId } });
  if (!cycle) throw ApiError.notFound("Audit cycle not found");
  if (cycle.status === AuditCycleStatus.CLOSED) throw ApiError.badRequest("This audit cycle is already closed");

  assertCanVerify(actor, cycle.auditorId);

  const item = await prisma.auditItem.findFirst({ where: { id: itemId, cycleId } });
  if (!item) throw ApiError.notFound("Audit item not found");

  const updated = await prisma.auditItem.update({
    where: { id: itemId },
    data: { status, notes, verifiedAt: new Date(), verifiedById: actor.id },
    include: itemInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "VERIFY_AUDIT_ITEM",
    entityType: "AuditItem",
    entityId: itemId,
    ipAddress,
    metadata: { asset: updated.asset.assetTag, status },
  });

  if (status === AuditItemStatus.MISSING || status === AuditItemStatus.DAMAGED) {
    const recipients = await prisma.user.findMany({
      where: { organizationId, deletedAt: null, role: { in: [Role.ORG_ADMIN, Role.ASSET_MANAGER] } },
      select: { id: true },
    });
    const label = status === AuditItemStatus.MISSING ? "missing" : "damaged";
    await Promise.all(
      recipients.map((recipient) =>
        notify({
          organizationId,
          userId: recipient.id,
          type: "AUDIT_DISCREPANCY",
          title: `Asset marked ${label} during audit`,
          message: `${updated.asset.assetTag} was marked ${label} during "${cycle.name}".`,
          entityType: "AuditItem",
          entityId: itemId,
        })
      )
    );
  }

  return updated;
}

export async function closeCycle(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const cycle = await prisma.auditCycle.findFirst({
    where: { id, organizationId },
    include: { items: { include: { asset: { select: { id: true, status: true, assetTag: true } } } } },
  });
  if (!cycle) throw ApiError.notFound("Audit cycle not found");
  if (cycle.status === AuditCycleStatus.CLOSED) throw ApiError.badRequest("This audit cycle is already closed");

  const pendingCount = cycle.items.filter((i) => i.status === AuditItemStatus.PENDING).length;
  if (pendingCount > 0) {
    throw ApiError.badRequest(`${pendingCount} asset(s) still need to be verified before this audit can be closed`);
  }

  // Confirmed-missing assets are written off as Lost so the fleet count stays
  // accurate; only applied where the asset's current status still permits it
  // (e.g. it hasn't since been retired/disposed by some other action).
  const missingItems = cycle.items.filter(
    (i) => i.status === AuditItemStatus.MISSING && isTransitionAllowed(i.asset.status, AssetStatus.LOST)
  );

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of missingItems) {
      await tx.asset.update({
        where: { id: item.asset.id },
        data: { status: AssetStatus.LOST, currentHolderId: null },
      });
      await tx.assetHistory.create({
        data: {
          assetId: item.asset.id,
          action: "MARKED_LOST_ON_AUDIT_CLOSE",
          fromStatus: item.asset.status,
          toStatus: AssetStatus.LOST,
          note: `Confirmed missing during audit cycle "${cycle.name}"`,
          performedById: actorUserId,
        },
      });
    }

    return tx.auditCycle.update({
      where: { id },
      data: { status: AuditCycleStatus.CLOSED, closedAt: new Date() },
      include: cycleInclude,
    });
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CLOSE_AUDIT_CYCLE",
    entityType: "AuditCycle",
    entityId: id,
    ipAddress,
    metadata: { assetsMarkedLost: missingItems.length },
  });

  return updated;
}
