import { apiClient } from "./client";
import type { AssetTransferRequest, CreateTransferRequestInput } from "../types/assetTransfer";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listTransferRequests(assetId?: string): Promise<AssetTransferRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<AssetTransferRequest[]>>("/asset-transfers", {
    params: assetId ? { assetId } : undefined,
  });
  return data.data;
}

export async function createTransferRequest(input: CreateTransferRequestInput): Promise<AssetTransferRequest> {
  const { data } = await apiClient.post<ApiEnvelope<AssetTransferRequest>>("/asset-transfers", input);
  return data.data;
}

export async function decideTransferRequest(id: string, approve: boolean, note?: string): Promise<AssetTransferRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetTransferRequest>>(`/asset-transfers/${id}/decision`, {
    approve,
    note,
  });
  return data.data;
}

export async function cancelTransferRequest(id: string): Promise<AssetTransferRequest> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetTransferRequest>>(`/asset-transfers/${id}/cancel`);
  return data.data;
}
