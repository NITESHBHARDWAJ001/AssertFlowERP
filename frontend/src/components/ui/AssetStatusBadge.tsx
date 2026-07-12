import { Badge } from "./Badge";
import { ASSET_STATUS_LABELS, type AssetStatus } from "../../types/asset";

const STATUS_TONE: Record<AssetStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  REGISTERED: "slate",
  AVAILABLE: "green",
  ALLOCATED: "blue",
  TRANSFERRED: "blue",
  RESERVED: "amber",
  MAINTENANCE: "amber",
  RETURNED: "slate",
  RETIRED: "red",
  DISPOSED: "red",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{ASSET_STATUS_LABELS[status]}</Badge>;
}
