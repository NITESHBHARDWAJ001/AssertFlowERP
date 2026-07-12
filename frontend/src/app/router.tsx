import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OrganizationsPage } from "../features/organizations/OrganizationsPage";
import { DepartmentsPage } from "../features/departments/DepartmentsPage";
import { EmployeesPage } from "../features/employees/EmployeesPage";
import { ActivityLogPage } from "../features/activity-log/ActivityLogPage";
import { AssetCategoriesPage } from "../features/asset-categories/AssetCategoriesPage";
import { AssetsPage } from "../features/assets/AssetsPage";
import { AssetDetailPage } from "../features/assets/AssetDetailPage";
import { AssetRequestsPage } from "../features/asset-requests/AssetRequestsPage";
import { ResourcesPage } from "../features/resources/ResourcesPage";
import { BookingsPage } from "../features/bookings/BookingsPage";
import { MaintenancePage } from "../features/maintenance/MaintenancePage";
import { AuditCyclesPage } from "../features/audits/AuditCyclesPage";
import { AuditCycleDetailPage } from "../features/audits/AuditCycleDetailPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { Role } from "../types/role";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
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
              { path: "/asset-categories", element: <AssetCategoriesPage /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
          {
            element: (
              <ProtectedRoute
                allowedRoles={[Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE]}
              />
            ),
            children: [
              { path: "/assets", element: <AssetsPage /> },
              { path: "/assets/:id", element: <AssetDetailPage /> },
              { path: "/asset-requests", element: <AssetRequestsPage /> },
              { path: "/bookings", element: <BookingsPage /> },
              { path: "/maintenance", element: <MaintenancePage /> },
              { path: "/audits", element: <AuditCyclesPage /> },
              { path: "/audits/:id", element: <AuditCycleDetailPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={[Role.ORG_ADMIN, Role.ASSET_MANAGER]} />,
            children: [{ path: "/resources", element: <ResourcesPage /> }],
          },
          {
            element: <ProtectedRoute allowedRoles={[Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD]} />,
            children: [
              { path: "/activity-log", element: <ActivityLogPage /> },
              { path: "/reports", element: <ReportsPage /> },
              { path: "/analytics", element: <AnalyticsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
