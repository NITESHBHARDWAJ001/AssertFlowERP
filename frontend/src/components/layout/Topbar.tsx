import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../features/auth/useAuth";
import { ROLE_LABELS } from "../../types/role";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        {user?.organizationId && <NotificationBell />}
        <ThemeToggle />
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
