import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";

interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  customFieldsSchema?: unknown;
}

export async function listCategories(organizationId: string) {
  return prisma.assetCategory.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true } } },
  });
}

export async function createCategory(
  organizationId: string,
  actorUserId: string,
  input: CategoryInput,
  ipAddress?: string
) {
  const existing = await prisma.assetCategory.findFirst({
    where: { organizationId, name: input.name, deletedAt: null },
  });
  if (existing) throw ApiError.conflict("A category with this name already exists");

  const category = await prisma.assetCategory.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description,
      icon: input.icon,
      customFieldsSchema: input.customFieldsSchema as Prisma.InputJsonValue | undefined,
    },
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_ASSET_CATEGORY",
    entityType: "AssetCategory",
    entityId: category.id,
    ipAddress,
    metadata: { name: category.name },
  });

  return category;
}

export async function updateCategory(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: Partial<CategoryInput>,
  ipAddress?: string
) {
  const existing = await prisma.assetCategory.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Category not found");

  const category = await prisma.assetCategory.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      icon: input.icon,
      customFieldsSchema: input.customFieldsSchema as Prisma.InputJsonValue | undefined,
    },
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_ASSET_CATEGORY",
    entityType: "AssetCategory",
    entityId: category.id,
    ipAddress,
  });

  return category;
}

export async function deleteCategory(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const existing = await prisma.assetCategory.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Category not found");

  const assetCount = await prisma.asset.count({ where: { categoryId: id, deletedAt: null } });
  if (assetCount > 0) {
    throw ApiError.badRequest("Cannot delete a category that still has assets assigned to it");
  }

  await prisma.assetCategory.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "DELETE_ASSET_CATEGORY",
    entityType: "AssetCategory",
    entityId: id,
    ipAddress,
  });
}
