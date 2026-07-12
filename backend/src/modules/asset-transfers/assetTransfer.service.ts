import { Role, TransferRequestStatus, AssetStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";
import { notify } from "../notifications/notification.service";
import type { AuthUser } from "../../middleware/authenticate";

const transferInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true, currentHolderId: true, currentDepartmentId: true } },
  requestedBy: { select: { id: true, firstName: true, lastName: true } },
  fromHolder: { select: { id: true, firstName: true, lastName: true } },
  toHolder: { select: { id: true, firstName: true, lastName: true } },
  decidedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

interface CreateInput {
  assetId: string;
  toHolderId?: string;
  reason?: string;
}

export async function createTransferRequest(
  organizationId: string,
  actor: AuthUser,
  input: CreateInput,
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id: input.assetId, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  if (asset.status !== AssetStatus.ALLOCATED) {
    throw ApiError.badRequest("Only currently allocated assets can be transferred");
  }
  if (!asset.currentHolderId) {
    throw ApiError.badRequest("This asset has no current holder to transfer from");
  }

  const toHolderId = input.toHolderId ?? actor.id;
  if (toHolderId === asset.currentHolderId) {
    throw ApiError.badRequest("This asset is already held by that person");
  }

  const toHolder = await prisma.user.findFirst({ where: { id: toHolderId, organizationId, deletedAt: null } });
  if (!toHolder) throw ApiError.badRequest("Target holder does not belong to your organization");

  const existingPending = await prisma.assetTransferRequest.findFirst({
    where: { assetId: asset.id, status: TransferRequestStatus.PENDING },
  });
  if (existingPending) throw ApiError.badRequest("This asset already has a pending transfer request");

  const request = await prisma.assetTransferRequest.create({
    data: {
      organizationId,
      assetId: asset.id,
      requestedById: actor.id,
      fromHolderId: asset.currentHolderId,
      toHolderId,
      reason: input.reason,
    },
    include: transferInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "CREATE_TRANSFER_REQUEST",
    entityType: "AssetTransferRequest",
    entityId: request.id,
    ipAddress,
    metadata: { assetTag: asset.assetTag },
  });

  // Notify whoever can act on it: Org Admin/Asset Manager, plus the head of
  // the asset's current department if one is assigned.
  const recipients = await prisma.user.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [
        { role: { in: [Role.ORG_ADMIN, Role.ASSET_MANAGER] } },
        ...(asset.currentDepartmentId ? [{ headOfDepartment: { id: asset.currentDepartmentId } } as const] : []),
      ],
    },
    select: { id: true },
  });
  await Promise.all(
    recipients.map((r) =>
      notify({
        organizationId,
        userId: r.id,
        type: "ASSET_REQUEST_DECISION",
        title: "Transfer request awaiting review",
        message: `${asset.assetTag} was requested for transfer.`,
        entityType: "AssetTransferRequest",
        entityId: request.id,
      })
    )
  );

  return request;
}

export async function listTransferRequests(organizationId: string, requestingUser: AuthUser, assetId?: string) {
  const isPrivileged = requestingUser.role === Role.ORG_ADMIN || requestingUser.role === Role.ASSET_MANAGER;

  return prisma.assetTransferRequest.findMany({
    where: {
      organizationId,
      assetId,
      ...(isPrivileged
        ? {}
        : {
            OR: [{ requestedById: requestingUser.id }, { fromHolderId: requestingUser.id }, { toHolderId: requestingUser.id }],
          }),
    },
    orderBy: { createdAt: "desc" },
    include: transferInclude,
  });
}

function assertCanDecide(actor: AuthUser) {
  const isPrivileged = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER || actor.role === Role.DEPARTMENT_HEAD;
  if (!isPrivileged) throw ApiError.forbidden("You are not allowed to decide on transfer requests");
}

export async function decideTransferRequest(
  organizationId: string,
  actor: AuthUser,
  id: string,
  approve: boolean,
  note: string | undefined,
  ipAddress?: string
) {
  assertCanDecide(actor);

  const request = await prisma.assetTransferRequest.findFirst({
    where: { id, organizationId },
    include: { asset: true },
  });
  if (!request) throw ApiError.notFound("Transfer request not found");
  if (request.status !== TransferRequestStatus.PENDING) {
    throw ApiError.badRequest("This request has already been decided");
  }

  if (actor.role === Role.DEPARTMENT_HEAD) {
    const dept = request.asset.currentDepartmentId
      ? await prisma.department.findFirst({ where: { id: request.asset.currentDepartmentId, headUserId: actor.id } })
      : null;
    if (!dept) throw ApiError.forbidden("You are not the department head for this asset");
  }

  if (!approve) {
    const updated = await prisma.assetTransferRequest.update({
      where: { id },
      data: { status: TransferRequestStatus.REJECTED, decidedById: actor.id, decidedAt: new Date(), decisionNote: note },
      include: transferInclude,
    });
    await recordActivity({
      organizationId,
      userId: actor.id,
      action: "REJECT_TRANSFER_REQUEST",
      entityType: "AssetTransferRequest",
      entityId: id,
      ipAddress,
    });
    await notify({
      organizationId,
      userId: request.requestedById,
      type: "ASSET_REQUEST_DECISION",
      title: "Transfer request rejected",
      message: `Your transfer request for ${request.asset.assetTag} was rejected.`,
      entityType: "AssetTransferRequest",
      entityId: id,
    });
    return updated;
  }

  if (request.asset.status !== AssetStatus.ALLOCATED || request.asset.currentHolderId !== request.fromHolderId) {
    throw ApiError.badRequest("This asset's holder has changed since the request was made; it can no longer be approved");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: request.assetId },
      data: { currentHolderId: request.toHolderId },
    });

    await tx.assetHistory.create({
      data: {
        assetId: request.assetId,
        action: "TRANSFERRED",
        fromStatus: AssetStatus.ALLOCATED,
        toStatus: AssetStatus.ALLOCATED,
        fromHolderId: request.fromHolderId,
        toHolderId: request.toHolderId,
        note: note ?? request.reason ?? undefined,
        performedById: actor.id,
      },
    });

    return tx.assetTransferRequest.update({
      where: { id },
      data: { status: TransferRequestStatus.APPROVED, decidedById: actor.id, decidedAt: new Date(), decisionNote: note },
      include: transferInclude,
    });
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "APPROVE_TRANSFER_REQUEST",
    entityType: "AssetTransferRequest",
    entityId: id,
    ipAddress,
    metadata: { assetTag: request.asset.assetTag },
  });

  await notify({
    organizationId,
    userId: request.toHolderId,
    type: "TRANSFER_APPROVED",
    title: "Asset transferred to you",
    message: `${request.asset.assetTag} has been transferred to you.`,
    entityType: "Asset",
    entityId: request.assetId,
  });
  if (request.fromHolderId) {
    await notify({
      organizationId,
      userId: request.fromHolderId,
      type: "TRANSFER_APPROVED",
      title: "Asset transferred from you",
      message: `${request.asset.assetTag} has been transferred to another employee.`,
      entityType: "Asset",
      entityId: request.assetId,
    });
  }

  return updated;
}

export async function cancelTransferRequest(organizationId: string, actor: AuthUser, id: string, ipAddress?: string) {
  const request = await prisma.assetTransferRequest.findFirst({ where: { id, organizationId } });
  if (!request) throw ApiError.notFound("Transfer request not found");
  if (request.requestedById !== actor.id) throw ApiError.forbidden("You can only cancel your own requests");
  if (request.status !== TransferRequestStatus.PENDING) {
    throw ApiError.badRequest("Only pending requests can be cancelled");
  }

  const updated = await prisma.assetTransferRequest.update({
    where: { id },
    data: { status: TransferRequestStatus.CANCELLED },
    include: transferInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "CANCEL_TRANSFER_REQUEST",
    entityType: "AssetTransferRequest",
    entityId: id,
    ipAddress,
  });

  return updated;
}
