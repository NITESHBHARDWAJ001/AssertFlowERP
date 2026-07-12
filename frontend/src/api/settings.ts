import { apiClient } from "./client";
import type { OrganizationSettings, UpdateSettingsInput } from "../types/settings";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getSettings(): Promise<OrganizationSettings> {
  const { data } = await apiClient.get<ApiEnvelope<OrganizationSettings>>("/settings");
  return data.data;
}

export async function updateSettings(input: UpdateSettingsInput): Promise<OrganizationSettings> {
  const { data } = await apiClient.patch<ApiEnvelope<OrganizationSettings>>("/settings", input);
  return data.data;
}
