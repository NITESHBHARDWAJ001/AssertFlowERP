import { apiClient } from "./client";
import type { AssetCategory, CreateAssetCategoryInput, UpdateAssetCategoryInput } from "../types/assetCategory";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listAssetCategories(): Promise<AssetCategory[]> {
  const { data } = await apiClient.get<ApiEnvelope<AssetCategory[]>>("/asset-categories");
  return data.data;
}

export async function createAssetCategory(input: CreateAssetCategoryInput): Promise<AssetCategory> {
  const { data } = await apiClient.post<ApiEnvelope<AssetCategory>>("/asset-categories", input);
  return data.data;
}

export async function updateAssetCategory(id: string, input: UpdateAssetCategoryInput): Promise<AssetCategory> {
  const { data } = await apiClient.patch<ApiEnvelope<AssetCategory>>(`/asset-categories/${id}`, input);
  return data.data;
}

export async function deleteAssetCategory(id: string): Promise<void> {
  await apiClient.delete(`/asset-categories/${id}`);
}
