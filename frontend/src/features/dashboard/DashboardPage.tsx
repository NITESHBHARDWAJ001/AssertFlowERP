import { useAuth } from "../../features/auth/useAuth";
import { Role, ROLE_LABELS } from "../../types/role";
import { StatCard } from "../../components/ui/StatCard";

// KPIs are placeholders wired up once the Asset module lands; the point of
// this shell is that every role gets a dashboard route, populated per-role.
const KPI_SETS: Record<Role, { label: string; value: string | number }[]> = {
  [Role.SUPER_ADMIN]: [
    { label: "Organizations", value: "—" },
    { label: "Active Organizations", value: "—" },
    { label: "Suspended Organizations", value: "—" },
    { label: "Platform Users", value: "—" },
  ],
  [Role.ORG_ADMIN]: [
    { label: "Total Assets", value: "—" },
    { label: "Departments", value: "—" },
    { label: "Employees", value: "—" },
    { label: "Pending Transfers", value: "—" },
  ],
  [Role.ASSET_MANAGER]: [
    { label: "Available Assets", value: "—" },
    { label: "Allocated Assets", value: "—" },
    { label: "Maintenance Today", value: "—" },
    { label: "Active Bookings", value: "—" },
  ],
  [Role.DEPARTMENT_HEAD]: [
    { label: "Department Assets", value: "—" },
    { label: "Pending Approvals", value: "—" },
    { label: "Upcoming Returns", value: "—" },
  ],
  [Role.EMPLOYEE]: [
    { label: "My Assets", value: "—" },
    { label: "Open Requests", value: "—" },
    { label: "Upcoming Bookings", value: "—" },
  ],
};

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const kpis = KPI_SETS[user.role];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Welcome back, {user.firstName}
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role]} dashboard</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>
    </div>
  );
}
