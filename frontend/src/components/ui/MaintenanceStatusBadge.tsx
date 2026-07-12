import { Badge } from "./Badge";
import { MAINTENANCE_STATUS_LABELS, type MaintenanceStatus } from "../../types/maintenance";

const STATUS_TONE: Record<MaintenanceStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  PENDING: "amber",
  APPROVED: "blue",
  TECHNICIAN_ASSIGNED: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
  REJECTED: "red",
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{MAINTENANCE_STATUS_LABELS[status]}</Badge>;
}
