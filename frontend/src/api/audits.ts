import { apiClient } from "./client";
import type { AuditCycle, AuditItem, AuditItemStatus, CreateAuditCycleInput } from "../types/audit";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listAuditCycles(): Promise<AuditCycle[]> {
  const { data } = await apiClient.get<ApiEnvelope<AuditCycle[]>>("/audits");
  return data.data;
}

export async function getAuditCycle(id: string): Promise<AuditCycle> {
  const { data } = await apiClient.get<ApiEnvelope<AuditCycle>>(`/audits/${id}`);
  return data.data;
}

export async function createAuditCycle(input: CreateAuditCycleInput): Promise<AuditCycle> {
  const { data } = await apiClient.post<ApiEnvelope<AuditCycle>>("/audits", input);
  return data.data;
}

export async function verifyAuditItem(
  cycleId: string,
  itemId: string,
  status: AuditItemStatus,
  notes?: string
): Promise<AuditItem> {
  const { data } = await apiClient.patch<ApiEnvelope<AuditItem>>(`/audits/${cycleId}/items/${itemId}`, {
    status,
    notes,
  });
  return data.data;
}

export async function closeAuditCycle(id: string): Promise<AuditCycle> {
  const { data } = await apiClient.patch<ApiEnvelope<AuditCycle>>(`/audits/${id}/close`);
  return data.data;
}
