import { Badge } from "./Badge";
import { ASSET_REQUEST_STATUS_LABELS, type AssetRequestStatus } from "../../types/assetRequest";

const STATUS_TONE: Record<AssetRequestStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  PENDING_DEPT_HEAD: "amber",
  PENDING_ASSET_MANAGER: "amber",
  ALLOCATED: "green",
  REJECTED: "red",
  CANCELLED: "slate",
};

export function AssetRequestStatusBadge({ status }: { status: AssetRequestStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{ASSET_REQUEST_STATUS_LABELS[status]}</Badge>;
}
