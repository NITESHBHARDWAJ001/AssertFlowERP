import { apiClient } from "./client";
import type {
  Asset,
  AssetListFilters,
  CreateAssetInput,
  TransitionAssetInput,
  UpdateAssetInput,
} from "../types/asset";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listAssets(filters: AssetListFilters = {}): Promise<Asset[]> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data } = await apiClient.get<ApiEnvelope<Asset[]>>("/assets", { params });
  return data.data;
}

export async function getAsset(id: string): Promise<Asset> {
  const { data } = await apiClient.get<ApiEnvelope<Asset>>(`/assets/${id}`);
  return data.data;
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const { data } = await apiClient.post<ApiEnvelope<Asset>>("/assets", input);
  return data.data;
}

export async function updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
  const { data } = await apiClient.patch<ApiEnvelope<Asset>>(`/assets/${id}`, input);
  return data.data;
}

export async function transitionAssetStatus(id: string, input: TransitionAssetInput): Promise<Asset> {
  const { data } = await apiClient.patch<ApiEnvelope<Asset>>(`/assets/${id}/status`, input);
  return data.data;
}

export async function returnAsset(id: string, condition?: string): Promise<Asset> {
  const { data } = await apiClient.post<ApiEnvelope<Asset>>(`/assets/${id}/return`, { condition });
  return data.data;
}

function toFormData(files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return formData;
}

export async function uploadAssetImages(id: string, files: File[]): Promise<Asset> {
  const { data } = await apiClient.post<ApiEnvelope<Asset>>(`/assets/${id}/images`, toFormData(files), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function uploadAssetDocuments(id: string, files: File[]): Promise<Asset> {
  const { data } = await apiClient.post<ApiEnvelope<Asset>>(`/assets/${id}/documents`, toFormData(files), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}
