import { apiClient } from "./client";
import type { CreateMaintenanceInput, MaintenanceRequest } from "../types/maintenance";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<MaintenanceRequest[]>>("/maintenance");
  return data.data;
}

export async function createMaintenanceRequest(input: CreateMaintenanceInput): Promise<MaintenanceRequest> {
  const { data } = await apiClient.post<ApiEnvelope<MaintenanceRequest>>("/maintenance", input);
  return data.data;
}

export async function decideMaintenanceRequest(
  id: string,
  approve: boolean,
  rejectionReason?: string
): Promise<MaintenanceRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<MaintenanceRequest>>(`/maintenance/${id}/decision`, {
    approve,
    rejectionReason,
  });
  return data.data;
}

export async function assignTechnician(id: string, technicianId: string): Promise<MaintenanceRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<MaintenanceRequest>>(`/maintenance/${id}/assign-technician`, {
    technicianId,
  });
  return data.data;
}

export async function startMaintenanceProgress(id: string): Promise<MaintenanceRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<MaintenanceRequest>>(`/maintenance/${id}/start`);
  return data.data;
}

export async function resolveMaintenanceRequest(id: string, resolution: string): Promise<MaintenanceRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<MaintenanceRequest>>(`/maintenance/${id}/resolve`, {
    resolution,
  });
  return data.data;
}
