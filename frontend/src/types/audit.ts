export const AuditCycleStatus = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
} as const;
export type AuditCycleStatus = (typeof AuditCycleStatus)[keyof typeof AuditCycleStatus];

export const AuditItemStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  MISSING: "MISSING",
  DAMAGED: "DAMAGED",
} as const;
export type AuditItemStatus = (typeof AuditItemStatus)[keyof typeof AuditItemStatus];

export interface AuditItem {
  id: string;
  asset: { id: string; assetTag: string; name: string; status: string };
  status: AuditItemStatus;
  notes: string | null;
  verifiedAt: string | null;
  verifiedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface AuditDiscrepancies {
  missing: number;
  damaged: number;
  verified: number;
  pending: number;
}

export interface AuditCycle {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  auditor: { id: string; firstName: string; lastName: string; email: string };
  createdBy: { id: string; firstName: string; lastName: string };
  status: AuditCycleStatus;
  closedAt: string | null;
  createdAt: string;
  _count?: { items: number };
  items?: AuditItem[];
  discrepancies?: AuditDiscrepancies;
}

export interface CreateAuditCycleInput {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  auditorId: string;
  categoryId?: string;
  departmentId?: string;
}
