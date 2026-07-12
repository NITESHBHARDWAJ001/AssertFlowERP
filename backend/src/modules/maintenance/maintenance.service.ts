import { AssetStatus, MaintenancePriority, MaintenanceStatus, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";
import { isTransitionAllowed } from "../assets/asset.stateMachine";
import { uploadFile } from "../../utils/storage";
import { notify } from "../notifications/notification.service";
import type { AuthUser } from "../../middleware/authenticate";

const maintenanceInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  raisedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  technician: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

interface ListFilters {
  status?: MaintenanceStatus;
}

export async function listRequests(organizationId: string, requestingUser: AuthUser, filters: ListFilters) {
  const isPrivileged =
    requestingUser.role === Role.ORG_ADMIN ||
    requestingUser.role === Role.ASSET_MANAGER ||
    requestingUser.role === Role.DEPARTMENT_HEAD;

  return prisma.maintenanceRequest.findMany({
    where: {
      organizationId,
      status: filters.status,
      raisedById: isPrivileged ? undefined : requestingUser.id,
    },
    orderBy: { createdAt: "desc" },
    include: maintenanceInclude,
  });
}

export async function getRequest(organizationId: string, id: string) {
  const request = await prisma.maintenanceRequest.findFirst({
    where: { id, organizationId },
    include: maintenanceInclude,
  });
  if (!request) throw ApiError.notFound("Maintenance request not found");
  return request;
}

interface CreateInput {
  assetId: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
}

export async function createRequest(
  organizationId: string,
  actorUserId: string,
  input: CreateInput,
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id: input.assetId, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.badRequest("Asset does not belong to your organization");

  const request = await prisma.maintenanceRequest.create({
    data: {
      organizationId,
      assetId: input.assetId,
      raisedById: actorUserId,
      title: input.title,
      description: input.description,
      priority: input.priority,
    },
    include: maintenanceInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_MAINTENANCE_REQUEST",
    entityType: "MaintenanceRequest",
    entityId: request.id,
    ipAddress,
    metadata: { asset: asset.assetTag },
  });

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { maintenanceRequiresApproval: true },
  });
  if (org?.maintenanceRequiresApproval === false) {
    return decideRequest(
      organizationId,
      { id: actorUserId, role: Role.EMPLOYEE, organizationId },
      request.id,
      true,
      undefined,
      ipAddress
    );
  }

  return request;
}

export async function decideRequest(
  organizationId: string,
  actor: AuthUser,
  id: string,
  approve: boolean,
  rejectionReason: string | undefined,
  ipAddress?: string
) {
  const request = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId }, include: { asset: true } });
  if (!request) throw ApiError.notFound("Maintenance request not found");
  if (request.status !== MaintenanceStatus.PENDING) {
    throw ApiError.badRequest("Only pending requests can be approved or rejected");
  }

  if (approve && request.asset.status !== AssetStatus.MAINTENANCE) {
    if (!isTransitionAllowed(request.asset.status, AssetStatus.MAINTENANCE)) {
      throw ApiError.badRequest(
        `This asset cannot enter maintenance from its current status (${request.asset.status})`
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (approve && request.asset.status !== AssetStatus.MAINTENANCE) {
      await tx.asset.update({ where: { id: request.assetId }, data: { status: AssetStatus.MAINTENANCE } });
      await tx.assetHistory.create({
        data: {
          assetId: request.assetId,
          action: "MAINTENANCE_APPROVED",
          fromStatus: request.asset.status,
          toStatus: AssetStatus.MAINTENANCE,
          note: request.title,
          performedById: actor.id,
        },
      });
    }

    return tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: approve ? MaintenanceStatus.APPROVED : MaintenanceStatus.REJECTED,
        approvedById: actor.id,
        approvedAt: new Date(),
        rejectionReason: approve ? null : rejectionReason,
      },
      include: maintenanceInclude,
    });
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: approve ? "APPROVE_MAINTENANCE" : "REJECT_MAINTENANCE",
    entityType: "MaintenanceRequest",
    entityId: id,
    ipAddress,
  });

  await notify({
    organizationId,
    userId: updated.raisedById,
    type: approve ? "MAINTENANCE_DUE" : "ASSET_REQUEST_DECISION",
    title: approve ? "Maintenance request approved" : "Maintenance request rejected",
    message: `Your maintenance request "${updated.title}" was ${approve ? "approved" : "rejected"}.`,
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  return updated;
}

export async function assignTechnician(
  organizationId: string,
  actor: AuthUser,
  id: string,
  technicianId: string,
  ipAddress?: string
) {
  const request = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId } });
  if (!request) throw ApiError.notFound("Maintenance request not found");
  if (request.status !== MaintenanceStatus.APPROVED && request.status !== MaintenanceStatus.TECHNICIAN_ASSIGNED) {
    throw ApiError.badRequest("A technician can only be assigned after approval");
  }

  const technician = await prisma.user.findFirst({ where: { id: technicianId, organizationId, deletedAt: null } });
  if (!technician) throw ApiError.badRequest("Technician does not belong to your organization");

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { technicianId, assignedAt: new Date(), status: MaintenanceStatus.TECHNICIAN_ASSIGNED },
    include: maintenanceInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "ASSIGN_TECHNICIAN",
    entityType: "MaintenanceRequest",
    entityId: id,
    ipAddress,
    metadata: { technician: `${technician.firstName} ${technician.lastName}` },
  });

  return updated;
}

export async function startProgress(organizationId: string, actor: AuthUser, id: string, ipAddress?: string) {
  const request = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId } });
  if (!request) throw ApiError.notFound("Maintenance request not found");
  if (request.status !== MaintenanceStatus.TECHNICIAN_ASSIGNED) {
    throw ApiError.badRequest("Work can only start once a technician is assigned");
  }

  const isPrivileged = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isPrivileged && request.technicianId !== actor.id) {
    throw ApiError.forbidden("Only the assigned technician or a manager can start this work");
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: MaintenanceStatus.IN_PROGRESS },
    include: maintenanceInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "START_MAINTENANCE",
    entityType: "MaintenanceRequest",
    entityId: id,
    ipAddress,
  });

  return updated;
}

export async function resolveRequest(
  organizationId: string,
  actor: AuthUser,
  id: string,
  resolution: string,
  ipAddress?: string
) {
  const request = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId }, include: { asset: true } });
  if (!request) throw ApiError.notFound("Maintenance request not found");
  if (request.status !== MaintenanceStatus.IN_PROGRESS) {
    throw ApiError.badRequest("Only in-progress requests can be resolved");
  }

  const isPrivileged = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isPrivileged && request.technicianId !== actor.id) {
    throw ApiError.forbidden("Only the assigned technician or a manager can resolve this request");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (request.asset.status === AssetStatus.MAINTENANCE && isTransitionAllowed(AssetStatus.MAINTENANCE, AssetStatus.AVAILABLE)) {
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: AssetStatus.AVAILABLE, currentHolderId: null },
      });
      await tx.assetHistory.create({
        data: {
          assetId: request.assetId,
          action: "MAINTENANCE_RESOLVED",
          fromStatus: AssetStatus.MAINTENANCE,
          toStatus: AssetStatus.AVAILABLE,
          note: resolution,
          performedById: actor.id,
        },
      });
    }

    return tx.maintenanceRequest.update({
      where: { id },
      data: { status: MaintenanceStatus.RESOLVED, resolution, resolvedAt: new Date() },
      include: maintenanceInclude,
    });
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "RESOLVE_MAINTENANCE",
    entityType: "MaintenanceRequest",
    entityId: id,
    ipAddress,
  });

  await notify({
    organizationId,
    userId: updated.raisedById,
    type: "MAINTENANCE_RESOLVED",
    title: "Maintenance resolved",
    message: `Your maintenance request "${updated.title}" has been resolved.`,
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  return updated;
}

interface IncomingFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export async function addPhotos(
  organizationId: string,
  actorUserId: string,
  id: string,
  files: IncomingFile[],
  ipAddress?: string
) {
  const request = await prisma.maintenanceRequest.findFirst({ where: { id, organizationId } });
  if (!request) throw ApiError.notFound("Maintenance request not found");

  const uploaded = await Promise.all(
    files.map((file) =>
      uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: `maintenance/${id}/photos`,
      })
    )
  );

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { photos: { push: uploaded.map((u) => u.url) } },
    include: maintenanceInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPLOAD_MAINTENANCE_PHOTOS",
    entityType: "MaintenanceRequest",
    entityId: id,
    ipAddress,
    metadata: { count: uploaded.length },
  });

  return updated;
}
