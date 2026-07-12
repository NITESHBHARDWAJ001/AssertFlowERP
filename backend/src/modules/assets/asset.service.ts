import { AssetStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { generateAssetTag } from "../../utils/assetTag";
import { generateAssetQrCode } from "../../utils/qrCode";
import { recordActivity } from "../activity-logs/activityLog.service";
import { isTransitionAllowed } from "./asset.stateMachine";
import { uploadFile } from "../../utils/storage";
import { notify } from "../notifications/notification.service";
import type { AuthUser } from "../../middleware/authenticate";

const assetInclude = {
  category: { select: { id: true, name: true, icon: true } },
  currentHolder: { select: { id: true, firstName: true, lastName: true, email: true } },
  currentDepartment: { select: { id: true, name: true } },
} satisfies Prisma.AssetInclude;

interface CreateAssetInput {
  name: string;
  categoryId: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiry?: Date;
  notes?: string;
  currentDepartmentId?: string;
  customFields?: Record<string, unknown>;
}

async function assertCategoryBelongsToOrg(categoryId: string, organizationId: string) {
  const category = await prisma.assetCategory.findFirst({ where: { id: categoryId, organizationId, deletedAt: null } });
  if (!category) throw ApiError.badRequest("Category does not belong to your organization");
}

async function assertDepartmentBelongsToOrg(departmentId: string, organizationId: string) {
  const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId, deletedAt: null } });
  if (!dept) throw ApiError.badRequest("Department does not belong to your organization");
}

async function assertUserBelongsToOrg(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId, deletedAt: null } });
  if (!user) throw ApiError.badRequest("User does not belong to your organization");
}

interface ListFilters {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  departmentId?: string;
}

// Visibility is role-scoped: Employees only ever see assets currently held
// by them; Department Heads see only their own department's assets. This is
// enforced server-side so the frontend can't widen it by omitting a filter.
export async function listAssets(organizationId: string, requestingUser: AuthUser, filters: ListFilters) {
  const where: Prisma.AssetWhereInput = { organizationId, deletedAt: null };

  if (requestingUser.role === Role.EMPLOYEE) {
    where.currentHolderId = requestingUser.id;
  } else if (requestingUser.role === Role.DEPARTMENT_HEAD) {
    const dept = await prisma.department.findFirst({ where: { headUserId: requestingUser.id, organizationId } });
    where.currentDepartmentId = dept?.id ?? "__none__";
  } else if (filters.departmentId) {
    where.currentDepartmentId = filters.departmentId;
  }

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { assetTag: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.asset.findMany({ where, orderBy: { createdAt: "desc" }, include: assetInclude });
}

export async function getAsset(organizationId: string, id: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      ...assetInclude,
      history: {
        orderBy: { createdAt: "desc" },
        include: { performedBy: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
  if (!asset) throw ApiError.notFound("Asset not found");
  return asset;
}

export async function createAsset(
  organizationId: string,
  actorUserId: string,
  input: CreateAssetInput,
  ipAddress?: string
) {
  await assertCategoryBelongsToOrg(input.categoryId, organizationId);
  if (input.currentDepartmentId) await assertDepartmentBelongsToOrg(input.currentDepartmentId, organizationId);

  const assetTag = await generateAssetTag(organizationId);

  const asset = await prisma.asset.create({
    data: {
      organizationId,
      assetTag,
      name: input.name,
      categoryId: input.categoryId,
      serialNumber: input.serialNumber,
      vendor: input.vendor,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      warrantyExpiry: input.warrantyExpiry,
      notes: input.notes,
      currentDepartmentId: input.currentDepartmentId,
      customFields: input.customFields as Prisma.InputJsonValue | undefined,
      status: AssetStatus.REGISTERED,
    },
    include: assetInclude,
  });

  const qrCodeUrl = await generateAssetQrCode(organizationId, asset.id, asset.assetTag);
  const updated = await prisma.asset.update({ where: { id: asset.id }, data: { qrCodeUrl }, include: assetInclude });

  await prisma.assetHistory.create({
    data: {
      assetId: asset.id,
      action: "REGISTERED",
      toStatus: AssetStatus.REGISTERED,
      performedById: actorUserId,
    },
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_ASSET",
    entityType: "Asset",
    entityId: asset.id,
    ipAddress,
    metadata: { assetTag: asset.assetTag, name: asset.name },
  });

  return updated;
}

interface UpdateAssetInput {
  name?: string;
  categoryId?: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  warrantyExpiry?: Date;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export async function updateAsset(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: UpdateAssetInput,
  ipAddress?: string
) {
  const existing = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Asset not found");

  if (input.categoryId) await assertCategoryBelongsToOrg(input.categoryId, organizationId);

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      serialNumber: input.serialNumber,
      vendor: input.vendor,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      warrantyExpiry: input.warrantyExpiry,
      notes: input.notes,
      customFields: input.customFields as Prisma.InputJsonValue | undefined,
    },
    include: assetInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_ASSET",
    entityType: "Asset",
    entityId: asset.id,
    ipAddress,
  });

  return asset;
}

interface TransitionInput {
  toStatus: AssetStatus;
  note?: string;
  toHolderId?: string;
  toDepartmentId?: string;
}

export async function transitionAssetStatus(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: TransitionInput,
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  if (!isTransitionAllowed(asset.status, input.toStatus)) {
    throw ApiError.badRequest(`Cannot move an asset from ${asset.status} to ${input.toStatus}`);
  }

  if (input.toHolderId) await assertUserBelongsToOrg(input.toHolderId, organizationId);
  if (input.toDepartmentId) await assertDepartmentBelongsToOrg(input.toDepartmentId, organizationId);

  // Allocating/transferring requires a target holder; returning clears it.
  const clearsHolderStatuses: AssetStatus[] = [AssetStatus.RETURNED, AssetStatus.AVAILABLE, AssetStatus.RETIRED];
  const clearsHolder = clearsHolderStatuses.includes(input.toStatus);
  const nextHolderId = clearsHolder ? null : input.toHolderId ?? asset.currentHolderId;
  const nextDepartmentId = input.toDepartmentId ?? asset.currentDepartmentId;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.asset.update({
      where: { id },
      data: {
        status: input.toStatus,
        currentHolderId: nextHolderId,
        currentDepartmentId: nextDepartmentId,
      },
      include: assetInclude,
    });

    await tx.assetHistory.create({
      data: {
        assetId: id,
        action: "STATUS_CHANGE",
        fromStatus: asset.status,
        toStatus: input.toStatus,
        fromHolderId: asset.currentHolderId,
        toHolderId: nextHolderId,
        note: input.note,
        performedById: actorUserId,
      },
    });

    return result;
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: `ASSET_STATUS_${input.toStatus}`,
    entityType: "Asset",
    entityId: id,
    ipAddress,
    metadata: { from: asset.status, to: input.toStatus },
  });

  if (nextHolderId && (input.toStatus === AssetStatus.ALLOCATED || input.toStatus === AssetStatus.TRANSFERRED)) {
    await notify({
      organizationId,
      userId: nextHolderId,
      type: input.toStatus === AssetStatus.ALLOCATED ? "ASSET_ASSIGNED" : "TRANSFER_APPROVED",
      title: input.toStatus === AssetStatus.ALLOCATED ? "Asset assigned to you" : "Asset transferred to you",
      message: `${updated.name} (${updated.assetTag}) is now assigned to you.`,
      entityType: "Asset",
      entityId: id,
    });
  }

  return updated;
}

// Self-service return: the current holder returns their own allocated
// asset with an optional condition note. Managers/admins may also return on
// behalf of a holder (e.g. after an offboarding).
export async function returnAsset(
  organizationId: string,
  actor: AuthUser,
  id: string,
  condition: string | undefined,
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  const isManager = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isManager && asset.currentHolderId !== actor.id) {
    throw ApiError.forbidden("You can only return assets currently allocated to you");
  }

  if (!isTransitionAllowed(asset.status, AssetStatus.RETURNED)) {
    throw ApiError.badRequest(`Cannot return an asset from status ${asset.status}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.asset.update({
      where: { id },
      data: { status: AssetStatus.RETURNED, currentHolderId: null },
      include: assetInclude,
    });

    await tx.assetHistory.create({
      data: {
        assetId: id,
        action: "RETURNED",
        fromStatus: asset.status,
        toStatus: AssetStatus.RETURNED,
        fromHolderId: asset.currentHolderId,
        note: condition,
        performedById: actor.id,
      },
    });

    return result;
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "RETURN_ASSET",
    entityType: "Asset",
    entityId: id,
    ipAddress,
  });

  return updated;
}

interface IncomingFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export async function addAssetImages(
  organizationId: string,
  actorUserId: string,
  id: string,
  files: IncomingFile[],
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  const uploaded = await Promise.all(
    files.map((file) =>
      uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: `assets/${id}/images`,
      })
    )
  );

  const updated = await prisma.asset.update({
    where: { id },
    data: { images: { push: uploaded.map((u) => u.url) } },
    include: assetInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPLOAD_ASSET_IMAGES",
    entityType: "Asset",
    entityId: id,
    ipAddress,
    metadata: { count: uploaded.length },
  });

  return updated;
}

export async function addAssetDocuments(
  organizationId: string,
  actorUserId: string,
  id: string,
  files: IncomingFile[],
  ipAddress?: string
) {
  const asset = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  const uploaded = await Promise.all(
    files.map((file) =>
      uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: `assets/${id}/documents`,
      })
    )
  );

  const updated = await prisma.asset.update({
    where: { id },
    data: { documents: { push: uploaded.map((u) => u.url) } },
    include: assetInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPLOAD_ASSET_DOCUMENTS",
    entityType: "Asset",
    entityId: id,
    ipAddress,
    metadata: { count: uploaded.length },
  });

  return updated;
}

export async function deleteAsset(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const asset = await prisma.asset.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!asset) throw ApiError.notFound("Asset not found");

  if (asset.status !== AssetStatus.REGISTERED && asset.status !== AssetStatus.AVAILABLE) {
    throw ApiError.badRequest(
      "Only assets that have never been allocated can be deleted. Retire and dispose it instead to preserve history."
    );
  }

  await prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "DELETE_ASSET",
    entityType: "Asset",
    entityId: id,
    ipAddress,
  });
}
