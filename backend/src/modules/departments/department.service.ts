import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";

interface DepartmentInput {
  name: string;
  parentDepartmentId?: string;
  headUserId?: string;
}

async function assertBelongsToOrg(
  model: "department" | "user",
  id: string,
  organizationId: string
) {
  const record =
    model === "department"
      ? await prisma.department.findFirst({ where: { id, organizationId, deletedAt: null } })
      : await prisma.user.findFirst({ where: { id, organizationId, deletedAt: null } });

  if (!record) throw ApiError.badRequest(`Referenced ${model} does not belong to your organization`);
}

export async function listDepartments(organizationId: string) {
  return prisma.department.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      headUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { employees: true } },
    },
  });
}

export async function createDepartment(
  organizationId: string,
  actorUserId: string,
  input: DepartmentInput,
  ipAddress?: string
) {
  if (input.parentDepartmentId) await assertBelongsToOrg("department", input.parentDepartmentId, organizationId);
  if (input.headUserId) await assertBelongsToOrg("user", input.headUserId, organizationId);

  const department = await prisma.department.create({
    data: { ...input, organizationId },
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_DEPARTMENT",
    entityType: "Department",
    entityId: department.id,
    ipAddress,
    metadata: { name: department.name },
  });

  return department;
}

export async function updateDepartment(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: Partial<DepartmentInput>,
  ipAddress?: string
) {
  const existing = await prisma.department.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Department not found");

  if (input.parentDepartmentId) await assertBelongsToOrg("department", input.parentDepartmentId, organizationId);
  if (input.headUserId) await assertBelongsToOrg("user", input.headUserId, organizationId);

  const department = await prisma.department.update({ where: { id }, data: input });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "UPDATE_DEPARTMENT",
    entityType: "Department",
    entityId: department.id,
    ipAddress,
  });

  return department;
}

export async function deleteDepartment(organizationId: string, actorUserId: string, id: string, ipAddress?: string) {
  const existing = await prisma.department.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Department not found");

  await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "DELETE_DEPARTMENT",
    entityType: "Department",
    entityId: id,
    ipAddress,
  });
}
