import { Badge } from "./Badge";
import type { AuditCycleStatus, AuditItemStatus } from "../../types/audit";

const CYCLE_TONE: Record<AuditCycleStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  DRAFT: "slate",
  IN_PROGRESS: "amber",
  CLOSED: "green",
};

export function AuditCycleStatusBadge({ status }: { status: AuditCycleStatus }) {
  return <Badge tone={CYCLE_TONE[status]}>{status.replace("_", " ")}</Badge>;
}

const ITEM_TONE: Record<AuditItemStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  PENDING: "slate",
  VERIFIED: "green",
  MISSING: "red",
  DAMAGED: "amber",
};

export function AuditItemStatusBadge({ status }: { status: AuditItemStatus }) {
  return <Badge tone={ITEM_TONE[status]}>{status}</Badge>;
}
