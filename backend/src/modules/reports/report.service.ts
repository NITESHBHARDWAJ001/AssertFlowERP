import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import type { ReportColumn } from "./export.util";

export type ReportType = "assets" | "departments" | "maintenance" | "bookings" | "audits";

interface ReportResult {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

async function assetsReport(organizationId: string): Promise<ReportResult> {
  const assets = await prisma.asset.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { assetTag: "asc" },
    include: {
      category: { select: { name: true } },
      currentHolder: { select: { firstName: true, lastName: true } },
      currentDepartment: { select: { name: true } },
    },
  });

  return {
    title: "Asset Report",
    columns: [
      { key: "assetTag", header: "Tag" },
      { key: "name", header: "Name" },
      { key: "category", header: "Category" },
      { key: "status", header: "Status" },
      { key: "holder", header: "Holder" },
      { key: "department", header: "Department" },
      { key: "vendor", header: "Vendor" },
      { key: "purchaseCost", header: "Purchase Cost" },
    ],
    rows: assets.map((a) => ({
      assetTag: a.assetTag,
      name: a.name,
      category: a.category.name,
      status: a.status,
      holder: a.currentHolder ? `${a.currentHolder.firstName} ${a.currentHolder.lastName}` : "",
      department: a.currentDepartment?.name ?? "",
      vendor: a.vendor ?? "",
      purchaseCost: a.purchaseCost?.toString() ?? "",
    })),
  };
}

async function departmentsReport(organizationId: string): Promise<ReportResult> {
  const departments = await prisma.department.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { employees: true, assets: true } },
      headUser: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    title: "Department Report",
    columns: [
      { key: "name", header: "Department" },
      { key: "head", header: "Head" },
      { key: "employeeCount", header: "Employees" },
      { key: "assetCount", header: "Assets" },
    ],
    rows: departments.map((d) => ({
      name: d.name,
      head: d.headUser ? `${d.headUser.firstName} ${d.headUser.lastName}` : "",
      employeeCount: d._count.employees,
      assetCount: d._count.assets,
    })),
  };
}

async function maintenanceReport(organizationId: string): Promise<ReportResult> {
  const requests = await prisma.maintenanceRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      asset: { select: { assetTag: true, name: true } },
      raisedBy: { select: { firstName: true, lastName: true } },
      technician: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    title: "Maintenance Report",
    columns: [
      { key: "asset", header: "Asset" },
      { key: "title", header: "Title" },
      { key: "priority", header: "Priority" },
      { key: "status", header: "Status" },
      { key: "raisedBy", header: "Raised By" },
      { key: "technician", header: "Technician" },
      { key: "createdAt", header: "Raised On" },
    ],
    rows: requests.map((r) => ({
      asset: `${r.asset.assetTag} - ${r.asset.name}`,
      title: r.title,
      priority: r.priority,
      status: r.status,
      raisedBy: `${r.raisedBy.firstName} ${r.raisedBy.lastName}`,
      technician: r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : "",
      createdAt: r.createdAt,
    })),
  };
}

async function bookingsReport(organizationId: string): Promise<ReportResult> {
  const bookings = await prisma.booking.findMany({
    where: { organizationId },
    orderBy: { startTime: "desc" },
    include: {
      resource: { select: { name: true, type: true } },
      bookedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    title: "Booking Report",
    columns: [
      { key: "resource", header: "Resource" },
      { key: "type", header: "Type" },
      { key: "bookedBy", header: "Booked By" },
      { key: "startTime", header: "Start" },
      { key: "endTime", header: "End" },
      { key: "status", header: "Status" },
    ],
    rows: bookings.map((b) => ({
      resource: b.resource.name,
      type: b.resource.type,
      bookedBy: `${b.bookedBy.firstName} ${b.bookedBy.lastName}`,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    })),
  };
}

async function auditsReport(organizationId: string): Promise<ReportResult> {
  const cycles = await prisma.auditCycle.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      auditor: { select: { firstName: true, lastName: true } },
      items: { select: { status: true } },
    },
  });

  return {
    title: "Audit Report",
    columns: [
      { key: "name", header: "Cycle" },
      { key: "auditor", header: "Auditor" },
      { key: "status", header: "Status" },
      { key: "totalAssets", header: "Total Assets" },
      { key: "missing", header: "Missing" },
      { key: "damaged", header: "Damaged" },
      { key: "startDate", header: "Start Date" },
    ],
    rows: cycles.map((c) => ({
      name: c.name,
      auditor: `${c.auditor.firstName} ${c.auditor.lastName}`,
      status: c.status,
      totalAssets: c.items.length,
      missing: c.items.filter((i) => i.status === "MISSING").length,
      damaged: c.items.filter((i) => i.status === "DAMAGED").length,
      startDate: c.startDate,
    })),
  };
}

export async function getReport(organizationId: string, type: ReportType): Promise<ReportResult> {
  switch (type) {
    case "assets":
      return assetsReport(organizationId);
    case "departments":
      return departmentsReport(organizationId);
    case "maintenance":
      return maintenanceReport(organizationId);
    case "bookings":
      return bookingsReport(organizationId);
    case "audits":
      return auditsReport(organizationId);
    default:
      throw ApiError.badRequest("Unknown report type");
  }
}
