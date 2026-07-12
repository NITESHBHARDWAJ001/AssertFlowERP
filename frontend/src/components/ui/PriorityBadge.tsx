import { Badge } from "./Badge";
import { MAINTENANCE_PRIORITY_LABELS, type MaintenancePriority } from "../../types/maintenance";

const PRIORITY_TONE: Record<MaintenancePriority, "green" | "red" | "amber" | "slate" | "blue"> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  CRITICAL: "red",
};

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{MAINTENANCE_PRIORITY_LABELS[priority]}</Badge>;
}
