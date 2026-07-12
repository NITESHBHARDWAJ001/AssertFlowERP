import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { getNavItemsForRole } from "../../lib/navConfig";
import { useAuth } from "../../features/auth/useAuth";

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const items = getNavItemsForRole(user.role);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-slate-200 px-5 dark:border-slate-800">
        <span className="text-lg font-semibold text-brand-700 dark:text-brand-400">AssetFlow</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
