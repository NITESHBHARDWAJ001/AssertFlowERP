import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { getNavItemsForRole } from "../../lib/navConfig";
import { useAuth } from "../../features/auth/useAuth";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = getNavItemsForRole(user.role);

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200 px-5 dark:border-slate-800">
        <span className="text-lg font-semibold text-brand-700 dark:text-brand-400">AssetFlow</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
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
    </>
  );
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div
        className={clsx(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={clsx(
            "absolute inset-0 bg-slate-900/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={clsx(
            "absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 ease-out dark:bg-slate-900",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent onNavigate={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}
