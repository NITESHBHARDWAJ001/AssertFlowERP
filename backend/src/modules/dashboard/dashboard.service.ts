import { AssetRequestStatus, AssetStatus, BookingStatus, MaintenanceStatus, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AuthUser } from "../../middleware/authenticate";

async function superAdminKpis() {
  const [total, active, suspended, users] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.organization.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);

  return [
    { label: "Organizations", value: total },
    { label: "Active Organizations", value: active },
    { label: "Suspended Organizations", value: suspended },
    { label: "Platform Users", value: users },
  ];
}

async function orgAdminKpis(organizationId: string) {
  const [totalAssets, departments, employees, pendingRequests, overdueReturns] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null } }),
    prisma.department.count({ where: { organizationId, deletedAt: null } }),
    prisma.user.count({ where: { organizationId, deletedAt: null } }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: { in: [AssetRequestStatus.PENDING_DEPT_HEAD, AssetRequestStatus.PENDING_ASSET_MANAGER] },
      },
    }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: AssetRequestStatus.ALLOCATED,
        expectedReturnDate: { not: null, lt: new Date() },
      },
    }),
  ]);

  return [
    { label: "Total Assets", value: totalAssets },
    { label: "Departments", value: departments },
    { label: "Employees", value: employees },
    { label: "Pending Transfers", value: pendingRequests },
    { label: "Overdue Returns", value: overdueReturns },
  ];
}

async function assetManagerKpis(organizationId: string) {
  const [available, allocated, openMaintenance, activeBookings, overdueReturns] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null, status: AssetStatus.AVAILABLE } }),
    prisma.asset.count({ where: { organizationId, deletedAt: null, status: AssetStatus.ALLOCATED } }),
    prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { notIn: [MaintenanceStatus.RESOLVED, MaintenanceStatus.REJECTED] },
      },
    }),
    prisma.booking.count({
      where: { organizationId, status: BookingStatus.APPROVED, endTime: { gte: new Date() } },
    }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: AssetRequestStatus.ALLOCATED,
        expectedReturnDate: { not: null, lt: new Date() },
      },
    }),
  ]);

  return [
    { label: "Available Assets", value: available },
    { label: "Allocated Assets", value: allocated },
    { label: "Maintenance Today", value: openMaintenance },
    { label: "Active Bookings", value: activeBookings },
    { label: "Overdue Returns", value: overdueReturns },
  ];
}

async function departmentHeadKpis(organizationId: string, userId: string) {
  const department = await prisma.department.findFirst({
    where: { organizationId, headUserId: userId, deletedAt: null },
    select: { id: true },
  });

  if (!department) {
    return [
      { label: "Department Assets", value: 0 },
      { label: "Pending Approvals", value: 0 },
      { label: "Upcoming Returns", value: 0 },
      { label: "Overdue Returns", value: 0 },
    ];
  }

  const [assets, pendingApprovals, upcomingReturns, overdueReturns] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null, currentDepartmentId: department.id } }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: AssetRequestStatus.PENDING_DEPT_HEAD,
        requestedBy: { departmentId: department.id },
      },
    }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: AssetRequestStatus.ALLOCATED,
        expectedReturnDate: { not: null, gte: new Date() },
        requestedBy: { departmentId: department.id },
      },
    }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        status: AssetRequestStatus.ALLOCATED,
        expectedReturnDate: { not: null, lt: new Date() },
        requestedBy: { departmentId: department.id },
      },
    }),
  ]);

  return [
    { label: "Department Assets", value: assets },
    { label: "Pending Approvals", value: pendingApprovals },
    { label: "Upcoming Returns", value: upcomingReturns },
    { label: "Overdue Returns", value: overdueReturns },
  ];
}

async function employeeKpis(organizationId: string, userId: string) {
  const [myAssets, openRequests, upcomingBookings] = await Promise.all([
    prisma.asset.count({ where: { organizationId, deletedAt: null, currentHolderId: userId } }),
    prisma.assetRequest.count({
      where: {
        organizationId,
        requestedById: userId,
        status: { in: [AssetRequestStatus.PENDING_DEPT_HEAD, AssetRequestStatus.PENDING_ASSET_MANAGER] },
      },
    }),
    prisma.booking.count({
      where: {
        organizationId,
        bookedById: userId,
        status: BookingStatus.APPROVED,
        startTime: { gte: new Date() },
      },
    }),
  ]);

  return [
    { label: "My Assets", value: myAssets },
    { label: "Open Requests", value: openRequests },
    { label: "Upcoming Bookings", value: upcomingBookings },
  ];
}

export async function getDashboardKpis(user: AuthUser) {
  if (user.role === Role.SUPER_ADMIN) return superAdminKpis();
  if (!user.organizationId) return [];

  switch (user.role) {
    case Role.ORG_ADMIN:
      return orgAdminKpis(user.organizationId);
    case Role.ASSET_MANAGER:
      return assetManagerKpis(user.organizationId);
    case Role.DEPARTMENT_HEAD:
      return departmentHeadKpis(user.organizationId, user.id);
    case Role.EMPLOYEE:
      return employeeKpis(user.organizationId, user.id);
    default:
      return [];
  }
}
