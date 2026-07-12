import { apiClient } from "./client";
import type { BookableResource, CreateResourceInput } from "../types/resource";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listResources(): Promise<BookableResource[]> {
  const { data } = await apiClient.get<ApiEnvelope<BookableResource[]>>("/resources");
  return data.data;
}

export async function createResource(input: CreateResourceInput): Promise<BookableResource> {
  const { data } = await apiClient.post<ApiEnvelope<BookableResource>>("/resources", input);
  return data.data;
}

export async function deleteResource(id: string): Promise<void> {
  await apiClient.delete(`/resources/${id}`);
}
