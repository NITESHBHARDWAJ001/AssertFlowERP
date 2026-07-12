import { AssetRequestStatus, AssetStatus, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";
import { notify } from "../notifications/notification.service";
import type { AuthUser } from "../../middleware/authenticate";

const requestInclude = {
  requestedBy: { select: { id: true, firstName: true, lastName: true, email: true, departmentId: true } },
  category: { select: { id: true, name: true } },
  asset: { select: { id: true, assetTag: true, name: true } },
  deptHeadApprovedBy: { select: { id: true, firstName: true, lastName: true } },
  assetManagerApprovedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

interface CreateRequestInput {
  categoryId: string;
  reason?: string;
  expectedReturnDate?: Date;
}

export async function createRequest(
  organizationId: string,
  requester: AuthUser,
  input: CreateRequestInput,
  ipAddress?: string
) {
  const category = await prisma.assetCategory.findFirst({
    where: { id: input.categoryId, organizationId, deletedAt: null },
  });
  if (!category) throw ApiError.badRequest("Category does not belong to your organization");

  const requesterRecord = await prisma.user.findUnique({
    where: { id: requester.id },
    select: { departmentId: true },
  });

  let initialStatus: AssetRequestStatus = AssetRequestStatus.PENDING_DEPT_HEAD;
  if (requesterRecord?.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: requesterRecord.departmentId } });
    if (!dept?.headUserId || dept.headUserId === requester.id) {
      // No head assigned, or the requester IS the head - nothing to approve at this stage.
      initialStatus = AssetRequestStatus.PENDING_ASSET_MANAGER;
    }
  } else {
    initialStatus = AssetRequestStatus.PENDING_ASSET_MANAGER;
  }

  const request = await prisma.assetRequest.create({
    data: {
      organizationId,
      requestedById: requester.id,
      categoryId: input.categoryId,
      reason: input.reason,
      expectedReturnDate: input.expectedReturnDate,
      status: initialStatus,
    },
    include: requestInclude,
  });

  await recordActivity({
    organizationId,
    userId: requester.id,
    action: "CREATE_ASSET_REQUEST",
    entityType: "AssetRequest",
    entityId: request.id,
    ipAddress,
    metadata: { category: category.name },
  });

  return request;
}

export async function listRequests(organizationId: string, requestingUser: AuthUser) {
  if (requestingUser.role === Role.ORG_ADMIN || requestingUser.role === Role.ASSET_MANAGER) {
    return prisma.assetRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: requestInclude,
    });
  }

  if (requestingUser.role === Role.DEPARTMENT_HEAD) {
    const headedDepartments = await prisma.department.findMany({
      where: { organizationId, headUserId: requestingUser.id },
      select: { id: true },
    });
    const deptIds = headedDepartments.map((d) => d.id);

    return prisma.assetRequest.findMany({
      where: {
        organizationId,
        OR: [{ requestedById: requestingUser.id }, { requestedBy: { departmentId: { in: deptIds } } }],
      },
      orderBy: { createdAt: "desc" },
      include: requestInclude,
    });
  }

  // EMPLOYEE: only their own requests
  return prisma.assetRequest.findMany({
    where: { organizationId, requestedById: requestingUser.id },
    orderBy: { createdAt: "desc" },
    include: requestInclude,
  });
}

export async function deptHeadDecision(
  organizationId: string,
  actor: AuthUser,
  requestId: string,
  approve: boolean,
  note: string | undefined,
  ipAddress?: string
) {
  const request = await prisma.assetRequest.findFirst({
    where: { id: requestId, organizationId },
    include: { requestedBy: { select: { departmentId: true } } },
  });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.status !== AssetRequestStatus.PENDING_DEPT_HEAD) {
    throw ApiError.badRequest("This request is not awaiting department head approval");
  }

  if (actor.role !== Role.ORG_ADMIN) {
    const dept = request.requestedBy.departmentId
      ? await prisma.department.findUnique({ where: { id: request.requestedBy.departmentId } })
      : null;
    if (!dept || dept.headUserId !== actor.id) {
      throw ApiError.forbidden("You are not the department head for this request");
    }
  }

  const updated = await prisma.assetRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? AssetRequestStatus.PENDING_ASSET_MANAGER : AssetRequestStatus.REJECTED,
      deptHeadApprovedById: actor.id,
      deptHeadDecisionAt: new Date(),
      deptHeadNote: note,
    },
    include: requestInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: approve ? "DEPT_HEAD_APPROVE_REQUEST" : "DEPT_HEAD_REJECT_REQUEST",
    entityType: "AssetRequest",
    entityId: requestId,
    ipAddress,
  });

  if (!approve) {
    await notify({
      organizationId,
      userId: updated.requestedById,
      type: "ASSET_REQUEST_DECISION",
      title: "Asset request rejected",
      message: `Your request for ${updated.category.name} was rejected by your department head.`,
      entityType: "AssetRequest",
      entityId: requestId,
    });
  }

  return updated;
}

export async function assetManagerDecision(
  organizationId: string,
  actor: AuthUser,
  requestId: string,
  approve: boolean,
  note: string | undefined,
  assetId: string | undefined,
  ipAddress?: string
) {
  const request = await prisma.assetRequest.findFirst({ where: { id: requestId, organizationId } });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.status !== AssetRequestStatus.PENDING_ASSET_MANAGER) {
    throw ApiError.badRequest("This request is not awaiting asset manager approval");
  }

  if (!approve) {
    const updated = await prisma.assetRequest.update({
      where: { id: requestId },
      data: {
        status: AssetRequestStatus.REJECTED,
        assetManagerApprovedById: actor.id,
        assetManagerDecisionAt: new Date(),
        assetManagerNote: note,
      },
      include: requestInclude,
    });
    await recordActivity({
      organizationId,
      userId: actor.id,
      action: "ASSET_MANAGER_REJECT_REQUEST",
      entityType: "AssetRequest",
      entityId: requestId,
      ipAddress,
    });
    await notify({
      organizationId,
      userId: updated.requestedById,
      type: "ASSET_REQUEST_DECISION",
      title: "Asset request rejected",
      message: `Your request for ${updated.category.name} was rejected.`,
      entityType: "AssetRequest",
      entityId: requestId,
    });
    return updated;
  }

  if (!assetId) throw ApiError.badRequest("Select an available asset to allocate");

  const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");
  if (asset.categoryId !== request.categoryId) throw ApiError.badRequest("Asset does not match the requested category");
  if (asset.status !== AssetStatus.AVAILABLE) {
    throw ApiError.badRequest(`Asset ${asset.assetTag} is not available (currently ${asset.status})`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.ALLOCATED, currentHolderId: request.requestedById },
    });

    await tx.assetHistory.create({
      data: {
        assetId,
        action: "ALLOCATED_VIA_REQUEST",
        fromStatus: AssetStatus.AVAILABLE,
        toStatus: AssetStatus.ALLOCATED,
        toHolderId: request.requestedById,
        note,
        performedById: actor.id,
      },
    });

    return tx.assetRequest.update({
      where: { id: requestId },
      data: {
        status: AssetRequestStatus.ALLOCATED,
        assetId,
        assetManagerApprovedById: actor.id,
        assetManagerDecisionAt: new Date(),
        assetManagerNote: note,
      },
      include: requestInclude,
    });
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "ASSET_MANAGER_APPROVE_REQUEST",
    entityType: "AssetRequest",
    entityId: requestId,
    ipAddress,
    metadata: { assetTag: asset.assetTag },
  });

  await notify({
    organizationId,
    userId: request.requestedById,
    type: "ASSET_ASSIGNED",
    title: "Asset assigned to you",
    message: `${asset.name} (${asset.assetTag}) has been allocated to you.`,
    entityType: "Asset",
    entityId: assetId,
  });

  return updated;
}

export async function cancelRequest(organizationId: string, actor: AuthUser, requestId: string, ipAddress?: string) {
  const request = await prisma.assetRequest.findFirst({ where: { id: requestId, organizationId } });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.requestedById !== actor.id) throw ApiError.forbidden("You can only cancel your own requests");
  const cancellableStatuses: AssetRequestStatus[] = [
    AssetRequestStatus.PENDING_DEPT_HEAD,
    AssetRequestStatus.PENDING_ASSET_MANAGER,
  ];
  if (!cancellableStatuses.includes(request.status)) {
    throw ApiError.badRequest("Only pending requests can be cancelled");
  }

  const updated = await prisma.assetRequest.update({
    where: { id: requestId },
    data: { status: AssetRequestStatus.CANCELLED },
    include: requestInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "CANCEL_ASSET_REQUEST",
    entityType: "AssetRequest",
    entityId: requestId,
    ipAddress,
  });

  return updated;
}
