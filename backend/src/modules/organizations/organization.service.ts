import { OrganizationStatus, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/hash";
import { recordActivity } from "../activity-logs/activityLog.service";

interface CreateOrganizationInput {
  name: string;
  slug: string;
  plan: string;
  admin: { email: string; firstName: string; lastName: string; password: string };
  actorUserId: string;
  ipAddress?: string;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const existingSlug = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (existingSlug) throw ApiError.conflict("An organization with this slug already exists");

  const existingEmail = await prisma.user.findFirst({ where: { email: input.admin.email } });
  if (existingEmail) throw ApiError.conflict("A user with this email already exists");

  const passwordHash = await hashPassword(input.admin.password);

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.name, slug: input.slug, plan: input.plan },
    });

    await tx.user.create({
      data: {
        organizationId: org.id,
        email: input.admin.email,
        firstName: input.admin.firstName,
        lastName: input.admin.lastName,
        passwordHash,
        role: Role.ORG_ADMIN,
      },
    });

    return org;
  });

  await recordActivity({
    organizationId: null,
    userId: input.actorUserId,
    action: "CREATE_ORGANIZATION",
    entityType: "Organization",
    entityId: organization.id,
    ipAddress: input.ipAddress,
    metadata: { name: organization.name, slug: organization.slug },
  });

  return organization;
}

export async function listOrganizations() {
  return prisma.organization.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, departments: true } } },
  });
}

async function setOrganizationStatus(
  id: string,
  status: OrganizationStatus,
  actorUserId: string,
  ipAddress?: string
) {
  const org = await prisma.organization.findFirst({ where: { id, deletedAt: null } });
  if (!org) throw ApiError.notFound("Organization not found");

  const updated = await prisma.organization.update({ where: { id }, data: { status } });

  await recordActivity({
    organizationId: null,
    userId: actorUserId,
    action: status === OrganizationStatus.SUSPENDED ? "SUSPEND_ORGANIZATION" : "ACTIVATE_ORGANIZATION",
    entityType: "Organization",
    entityId: id,
    ipAddress,
  });

  return updated;
}

export function suspendOrganization(id: string, actorUserId: string, ipAddress?: string) {
  return setOrganizationStatus(id, OrganizationStatus.SUSPENDED, actorUserId, ipAddress);
}

export function activateOrganization(id: string, actorUserId: string, ipAddress?: string) {
  return setOrganizationStatus(id, OrganizationStatus.ACTIVE, actorUserId, ipAddress);
}
