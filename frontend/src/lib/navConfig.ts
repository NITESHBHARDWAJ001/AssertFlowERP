import type { ComponentType, SVGProps } from "react";
import { Role } from "../types/role";
import {
  ActivityIcon,
  AnalyticsIcon,
  AssetsIcon,
  AuditsIcon,
  BookingsIcon,
  CategoriesIcon,
  DashboardIcon,
  DepartmentIcon,
  EmployeesIcon,
  MaintenanceIcon,
  OrganizationIcon,
  ReportsIcon,
  RequestsIcon,
  ResourcesIcon,
  SettingsIcon,
} from "../components/icons";

export interface NavItem {
  label: string;
  path: string;
  roles: Role[];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Single source of truth for sidebar nav. Adding a role or a module later
// means adding an entry here - layout components never hardcode role checks.
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: DashboardIcon,
    roles: [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Organizations",
    path: "/organizations",
    icon: OrganizationIcon,
    roles: [Role.SUPER_ADMIN],
  },
  {
    label: "Departments",
    path: "/departments",
    icon: DepartmentIcon,
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Employees",
    path: "/employees",
    icon: EmployeesIcon,
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Assets",
    path: "/assets",
    icon: AssetsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Asset Categories",
    path: "/asset-categories",
    icon: CategoriesIcon,
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Asset Requests",
    path: "/asset-requests",
    icon: RequestsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Bookings",
    path: "/bookings",
    icon: BookingsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: MaintenanceIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Audits",
    path: "/audits",
    icon: AuditsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: ReportsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD],
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: AnalyticsIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD],
  },
  {
    label: "Settings",
    path: "/settings",
    icon: SettingsIcon,
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Resources",
    path: "/resources",
    icon: ResourcesIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER],
  },
  {
    label: "Activity Log",
    path: "/activity-log",
    icon: ActivityIcon,
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD],
  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
