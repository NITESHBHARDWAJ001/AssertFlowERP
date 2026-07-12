export const AssetStatus = {
  REGISTERED: "REGISTERED",
  AVAILABLE: "AVAILABLE",
  ALLOCATED: "ALLOCATED",
  TRANSFERRED: "TRANSFERRED",
  RESERVED: "RESERVED",
  MAINTENANCE: "MAINTENANCE",
  RETURNED: "RETURNED",
  LOST: "LOST",
  RETIRED: "RETIRED",
  DISPOSED: "DISPOSED",
} as const;

export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  REGISTERED: "Registered",
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  TRANSFERRED: "Transferred",
  RESERVED: "Reserved",
  MAINTENANCE: "Maintenance",
  RETURNED: "Returned",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

export interface AssetHistoryEntry {
  id: string;
  action: string;
  fromStatus: AssetStatus | null;
  toStatus: AssetStatus | null;
  fromHolderId: string | null;
  toHolderId: string | null;
  note: string | null;
  performedBy: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  organizationId: string;
  assetTag: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string; icon: string | null };
  serialNumber: string | null;
  status: AssetStatus;
  currentHolder: { id: string; firstName: string; lastName: string; email: string } | null;
  currentHolderId: string | null;
  currentDepartment: { id: string; name: string } | null;
  currentDepartmentId: string | null;
  vendor: string | null;
  purchaseDate: string | null;
  purchaseCost: string | null;
  warrantyExpiry: string | null;
  location: string | null;
  condition: string | null;
  images: string[];
  documents: string[];
  qrCodeUrl: string | null;
  notes: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  history?: AssetHistoryEntry[];
  allowedTransitions?: AssetStatus[];
}

export interface CreateAssetInput {
  name: string;
  categoryId: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  location?: string;
  condition?: string;
  notes?: string;
  currentDepartmentId?: string;
}

export interface UpdateAssetInput {
  name?: string;
  categoryId?: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  location?: string;
  condition?: string;
  notes?: string;
}

export interface TransitionAssetInput {
  toStatus: AssetStatus;
  note?: string;
  toHolderId?: string;
  toDepartmentId?: string;
}

export interface AssetListFilters {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  departmentId?: string;
  location?: string;
}
