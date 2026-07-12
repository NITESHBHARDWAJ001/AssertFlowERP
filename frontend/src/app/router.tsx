import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OrganizationsPage } from "../features/organizations/OrganizationsPage";
import { DepartmentsPage } from "../features/departments/DepartmentsPage";
import { EmployeesPage } from "../features/employees/EmployeesPage";
import { ActivityLogPage } from "../features/activity-log/ActivityLogPage";
import { Role } from "../types/role";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          {
            element: <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]} />,
            children: [{ path: "/organizations", element: <OrganizationsPage /> }],
          },
          {
            element: <ProtectedRoute allowedRoles={[Role.ORG_ADMIN]} />,
            children: [
              { path: "/departments", element: <DepartmentsPage /> },
              { path: "/employees", element: <EmployeesPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={[Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD]} />,
            children: [{ path: "/activity-log", element: <ActivityLogPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
