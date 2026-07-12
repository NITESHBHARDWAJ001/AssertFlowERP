import { AssetStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";

function lastNMonths(n: number): { key: string; label: string; start: Date; end: Date }[] {
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleString("default", { month: "short", year: "2-digit" }),
      start,
      end,
    });
  }
  return months;
}

function bucketByMonth(dates: Date[], months: ReturnType<typeof lastNMonths>) {
  return months.map((m) => ({
    label: m.label,
    count: dates.filter((d) => d >= m.start && d < m.end).length,
  }));
}

export async function getAnalytics(organizationId: string) {
  const [assets, categories, departments, maintenanceRequests, allocationHistory, bookings] = await Promise.all([
    prisma.asset.findMany({
      where: { organizationId, deletedAt: null },
      select: { status: true, categoryId: true, currentDepartmentId: true },
    }),
    prisma.assetCategory.findMany({ where: { organizationId, deletedAt: null }, select: { id: true, name: true } }),
    prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, _count: { select: { assets: true } } },
    }),
    prisma.maintenanceRequest.findMany({ where: { organizationId }, select: { createdAt: true, status: true } }),
    prisma.assetHistory.findMany({
      where: { asset: { organizationId }, toStatus: AssetStatus.ALLOCATED },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({ where: { organizationId }, select: { startTime: true, status: true } }),
  ]);

  const assetsByCategory = categories.map((c) => ({
    name: c.name,
    count: assets.filter((a) => a.categoryId === c.id).length,
  }));

  const assetsByDepartment = departments.map((d) => ({
    name: d.name,
    count: assets.filter((a) => a.currentDepartmentId === d.id).length,
  }));

  const statusCounts = new Map<string, number>();
  assets.forEach((a) => statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1));
  const assetsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  const totalAssets = assets.length;
  const allocatedAssets = assets.filter((a) => a.status === AssetStatus.ALLOCATED).length;
  const utilization = {
    totalAssets,
    allocatedAssets,
    utilizationRate: totalAssets > 0 ? Math.round((allocatedAssets / totalAssets) * 100) : 0,
  };

  const months = lastNMonths(6);
  const maintenanceTrend = bucketByMonth(
    maintenanceRequests.map((m) => m.createdAt),
    months
  );
  const monthlyAllocation = bucketByMonth(
    allocationHistory.map((h) => h.createdAt),
    months
  );

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bookingsByDay = dayLabels.map((label, i) => ({
    label,
    count: bookings.filter((b) => new Date(b.startTime).getDay() === i).length,
  }));

  // Maintenance count per department requires joining through Asset.currentDepartmentId
  const maintenanceByAsset = await prisma.maintenanceRequest.findMany({
    where: { organizationId },
    select: { asset: { select: { currentDepartmentId: true } } },
  });
  const departmentPerformance = departments.map((d) => ({
    name: d.name,
    assetCount: d._count.assets,
    maintenanceCount: maintenanceByAsset.filter((m) => m.asset.currentDepartmentId === d.id).length,
  }));

  return {
    assetsByCategory,
    assetsByDepartment,
    assetsByStatus,
    utilization,
    maintenanceTrend,
    monthlyAllocation,
    bookingsByDay,
    departmentPerformance,
  };
}
