export const TransferRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type TransferRequestStatus = (typeof TransferRequestStatus)[keyof typeof TransferRequestStatus];

export const TRANSFER_REQUEST_STATUS_LABELS: Record<TransferRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export interface AssetTransferRequest {
  id: string;
  organizationId: string;
  asset: { id: string; assetTag: string; name: string; status: string };
  requestedBy: { id: string; firstName: string; lastName: string };
  fromHolder: { id: string; firstName: string; lastName: string } | null;
  toHolder: { id: string; firstName: string; lastName: string };
  reason: string | null;
  status: TransferRequestStatus;
  decidedBy: { id: string; firstName: string; lastName: string } | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface CreateTransferRequestInput {
  assetId: string;
  toHolderId?: string;
  reason?: string;
}
