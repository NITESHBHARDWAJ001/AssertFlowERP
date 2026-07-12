import { apiClient } from "./client";

export interface DashboardKpi {
  label: string;
  value: number | string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getDashboardKpis(): Promise<DashboardKpi[]> {
  const { data } = await apiClient.get<ApiEnvelope<DashboardKpi[]>>("/dashboard");
  return data.data;
}
