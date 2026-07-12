import { apiClient } from "./client";
import type { AnalyticsData } from "../types/analytics";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const { data } = await apiClient.get<ApiEnvelope<AnalyticsData>>("/analytics");
  return data.data;
}
