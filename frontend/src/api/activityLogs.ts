import { apiClient } from "./client";

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listActivityLogs(): Promise<ActivityLog[]> {
  const { data } = await apiClient.get<ApiEnvelope<ActivityLog[]>>("/activity-logs");
  return data.data;
}
