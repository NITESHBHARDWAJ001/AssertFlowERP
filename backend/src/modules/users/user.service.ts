import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/hash";
import { recordActivity } from "../activity-logs/activityLog.service";

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  departmentId: true,
  createdAt: true,
} as const;

interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
  departmentId?: string;
}

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: publicUserSelect,
  });
}

export async function createUser(
  organizationId: string,
  actorUserId: string,
  input: CreateUserInput,
  ipAddress?: string
) {
  const existing = await prisma.user.findFirst({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  if (input.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: input.departmentId, organizationId, deletedAt: null },
    });
    if (!dept) throw ApiError.badRequest("Department does not belong to your organization");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      organizationId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      departmentId: input.departmentId,
      passwordHash,
    },
    select: publicUserSelect,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_USER",
    entityType: "User",
    entityId: user.id,
    ipAddress,
    metadata: { email: user.email, role: user.role },
  });

  return user;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: Role;
  departmentId?: string | null;
  isActive?: boolean;
}

export async function updateUser(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: UpdateUserInput,
  ipAddress?: string
) {
  const existing = await prisma.user.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("User not found");

  if (input.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: input.departmentId, organizationId, deletedAt: null },
    });
    if (!dept) throw ApiError.badRequest("Department does not belong to your organization");
  }

  const user = await prisma.user.update({
    where: { id },
    data: input,
    select: publicUserSelect,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_USER",
    entityType: "User",
    entityId: user.id,
    ipAddress,
  });

  return user;
}

export async function deleteUser(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const existing = await prisma.user.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("User not found");
  if (existing.id === actorUserId) throw ApiError.badRequest("You cannot deactivate your own account");

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "DELETE_USER",
    entityType: "User",
    entityId: id,
    ipAddress,
  });
}
