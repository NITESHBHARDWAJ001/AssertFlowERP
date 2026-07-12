import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { getAnalytics } from "../../api/analytics";
import type { AnalyticsData } from "../../types/analytics";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
const AXIS_COLOR = "#94a3b8";
const GRID_COLOR = "#e2e8f0";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="h-64">{children}</div>
      </CardBody>
    </Card>
  );
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({ queryKey: ["analytics"], queryFn: getAnalytics });

  if (isLoading || !data) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics</h1>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Assets" value={data.utilization.totalAssets} />
        <StatCard label="Allocated Assets" value={data.utilization.allocatedAssets} />
        <StatCard label="Utilization Rate" value={`${data.utilization.utilizationRate}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Assets by Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.assetsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assets by Department">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.assetsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Asset Status Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.assetsByStatus} dataKey="count" nameKey="status" outerRadius={90} label>
                {data.assetsByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bookings by Day of Week">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.bookingsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance Trend (6 months)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.maintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS[2]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Allocation (6 months)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyAllocation}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assetCount" name="Assets" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="maintenanceCount" name="Maintenance" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
