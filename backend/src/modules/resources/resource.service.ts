import { ResourceType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";

interface ResourceInput {
  name: string;
  type: ResourceType;
  location?: string;
  capacity?: number;
  description?: string;
}

export async function listResources(organizationId: string) {
  return prisma.bookableResource.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createResource(
  organizationId: string,
  actorUserId: string,
  input: ResourceInput,
  ipAddress?: string
) {
  const existing = await prisma.bookableResource.findFirst({
    where: { organizationId, name: input.name, deletedAt: null },
  });
  if (existing) throw ApiError.conflict("A resource with this name already exists");

  const resource = await prisma.bookableResource.create({ data: { ...input, organizationId } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_RESOURCE",
    entityType: "BookableResource",
    entityId: resource.id,
    ipAddress,
    metadata: { name: resource.name },
  });

  return resource;
}

export async function updateResource(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: Partial<ResourceInput>,
  ipAddress?: string
) {
  const existing = await prisma.bookableResource.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Resource not found");

  const resource = await prisma.bookableResource.update({ where: { id }, data: input });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_RESOURCE",
    entityType: "BookableResource",
    entityId: resource.id,
    ipAddress,
  });

  return resource;
}

export async function deleteResource(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const existing = await prisma.bookableResource.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Resource not found");

  await prisma.bookableResource.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "DELETE_RESOURCE",
    entityType: "BookableResource",
    entityId: id,
    ipAddress,
  });
}
