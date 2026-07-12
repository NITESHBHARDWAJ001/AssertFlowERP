import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getDashboardKpis } from "../../api/dashboard";
import { useAuth } from "../../features/auth/useAuth";
import { Role, ROLE_LABELS } from "../../types/role";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";

const QUICK_ACTIONS: Partial<Record<Role, { label: string; to: string }[]>> = {
  [Role.ORG_ADMIN]: [
    { label: "Register Asset", to: "/assets" },
    { label: "Book Resource", to: "/bookings" },
    { label: "Raise Maintenance Request", to: "/maintenance" },
  ],
  [Role.ASSET_MANAGER]: [
    { label: "Register Asset", to: "/assets" },
    { label: "Book Resource", to: "/bookings" },
    { label: "Raise Maintenance Request", to: "/maintenance" },
  ],
  [Role.DEPARTMENT_HEAD]: [{ label: "Book Resource", to: "/bookings" }],
  [Role.EMPLOYEE]: [
    { label: "Book Resource", to: "/bookings" },
    { label: "Raise Maintenance Request", to: "/maintenance" },
  ],
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: kpis = [], isLoading } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: getDashboardKpis,
  });

  if (!user) return null;

  const quickActions = QUICK_ACTIONS[user.role] ?? [];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Welcome back, {user.firstName}
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role]} dashboard</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCard key={i} label="Loading…" value="—" />
            ))
          : kpis.map((kpi) => <StatCard key={kpi.label} label={kpi.label} value={kpi.value} />)}
      </div>

      {quickActions.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.to} variant="secondary" size="sm" onClick={() => navigate(action.to)}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
