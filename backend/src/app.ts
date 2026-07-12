import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organizations/organization.routes";
import departmentRoutes from "./modules/departments/department.routes";
import userRoutes from "./modules/users/user.routes";
import activityLogRoutes from "./modules/activity-logs/activityLog.routes";
import assetCategoryRoutes from "./modules/asset-categories/category.routes";
import assetRoutes from "./modules/assets/asset.routes";
import assetRequestRoutes from "./modules/asset-requests/assetRequest.routes";
import assetTransferRoutes from "./modules/asset-transfers/assetTransfer.routes";
import resourceRoutes from "./modules/resources/resource.routes";
import bookingRoutes from "./modules/bookings/booking.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";
import auditRoutes from "./modules/audits/audit.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import reportRoutes from "./modules/reports/report.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Local-disk upload fallback (used when Cloudinary isn't configured) - needs
// a relaxed Cross-Origin-Resource-Policy so the frontend origin can load
// these as <img> sources.
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "..", "uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/asset-categories", assetCategoryRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/asset-requests", assetRequestRoutes);
app.use("/api/asset-transfers", assetTransferRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/audits", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
