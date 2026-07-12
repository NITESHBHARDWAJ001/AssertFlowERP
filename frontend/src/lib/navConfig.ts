import { Role } from "../types/role";

export interface NavItem {
  label: string;
  path: string;
  roles: Role[];
}

// Single source of truth for sidebar nav. Adding a role or a module later
// means adding an entry here - layout components never hardcode role checks.
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE],
  },
  {
    label: "Organizations",
    path: "/organizations",
    roles: [Role.SUPER_ADMIN],
  },
  {
    label: "Departments",
    path: "/departments",
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Employees",
    path: "/employees",
    roles: [Role.ORG_ADMIN],
  },
  {
    label: "Activity Log",
    path: "/activity-log",
    roles: [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD],
  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
