export const AssetRequestStatus = {
  PENDING_DEPT_HEAD: "PENDING_DEPT_HEAD",
  PENDING_ASSET_MANAGER: "PENDING_ASSET_MANAGER",
  ALLOCATED: "ALLOCATED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type AssetRequestStatus = (typeof AssetRequestStatus)[keyof typeof AssetRequestStatus];

export const ASSET_REQUEST_STATUS_LABELS: Record<AssetRequestStatus, string> = {
  PENDING_DEPT_HEAD: "Awaiting Department Head",
  PENDING_ASSET_MANAGER: "Awaiting Asset Manager",
  ALLOCATED: "Allocated",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export interface AssetRequest {
  id: string;
  organizationId: string;
  requestedBy: { id: string; firstName: string; lastName: string; email: string; departmentId: string | null };
  category: { id: string; name: string };
  asset: { id: string; assetTag: string; name: string } | null;
  reason: string | null;
  expectedReturnDate: string | null;
  status: AssetRequestStatus;
  deptHeadApprovedBy: { id: string; firstName: string; lastName: string } | null;
  deptHeadDecisionAt: string | null;
  deptHeadNote: string | null;
  assetManagerApprovedBy: { id: string; firstName: string; lastName: string } | null;
  assetManagerDecisionAt: string | null;
  assetManagerNote: string | null;
  createdAt: string;
}

export interface CreateAssetRequestInput {
  categoryId: string;
  reason?: string;
  expectedReturnDate?: string;
}
