export const MaintenancePriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type MaintenancePriority = (typeof MaintenancePriority)[keyof typeof MaintenancePriority];

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const MaintenanceStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  TECHNICIAN_ASSIGNED: "TECHNICIAN_ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
} as const;
export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  TECHNICIAN_ASSIGNED: "Technician Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export interface MaintenanceRequest {
  id: string;
  organizationId: string;
  asset: { id: string; assetTag: string; name: string; status: string };
  raisedBy: { id: string; firstName: string; lastName: string; email: string };
  title: string;
  description: string | null;
  priority: MaintenancePriority;
  photos: string[];
  status: MaintenanceStatus;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  rejectionReason: string | null;
  technician: { id: string; firstName: string; lastName: string; email: string } | null;
  resolution: string | null;
  createdAt: string;
}

export interface CreateMaintenanceInput {
  assetId: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
}
