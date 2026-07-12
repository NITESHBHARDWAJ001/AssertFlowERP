import { apiClient } from "./client";
import type { AssetRequest, CreateAssetRequestInput } from "../types/assetRequest";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listAssetRequests(): Promise<AssetRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<AssetRequest[]>>("/asset-requests");
  return data.data;
}

export async function createAssetRequest(input: CreateAssetRequestInput): Promise<AssetRequest> {
  const { data } = await apiClient.post<ApiEnvelope<AssetRequest>>("/asset-requests", input);
  return data.data;
}

export async function deptHeadDecision(id: string, approve: boolean, note?: string): Promise<AssetRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetRequest>>(`/asset-requests/${id}/dept-head-decision`, {
    approve,
    note,
  });
  return data.data;
}

export async function assetManagerDecision(
  id: string,
  approve: boolean,
  assetId?: string,
  note?: string
): Promise<AssetRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetRequest>>(`/asset-requests/${id}/asset-manager-decision`, {
    approve,
    assetId,
    note,
  });
  return data.data;
}

export async function cancelAssetRequest(id: string): Promise<AssetRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetRequest>>(`/asset-requests/${id}/cancel`);
  return data.data;
}
