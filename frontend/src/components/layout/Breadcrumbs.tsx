import { Link, useLocation } from "react-router-dom";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  organizations: "Organizations",
  departments: "Departments",
  employees: "Employees",
  "activity-log": "Activity Log",
  assets: "Assets",
  "asset-categories": "Asset Categories",
  "asset-requests": "Asset Requests",
  bookings: "Bookings",
  resources: "Resources",
  maintenance: "Maintenance",
  audits: "Audits",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="mb-4 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link to="/dashboard" className="hover:text-brand-600">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const path = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = LABELS[segment] ?? segment;
          return (
            <li key={path} className="flex items-center gap-1.5">
              <span>/</span>
              {isLast ? (
                <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
              ) : (
                <Link to={path} className="hover:text-brand-600">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
