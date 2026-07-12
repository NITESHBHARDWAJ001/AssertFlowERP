import { apiClient } from "./client";
import type { CreateOrganizationInput, Organization } from "../types/organization";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listOrganizations(): Promise<Organization[]> {
  const { data } = await apiClient.get<ApiEnvelope<Organization[]>>("/organizations");
  return data.data;
}

export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const { data } = await apiClient.post<ApiEnvelope<Organization>>("/organizations", input);
  return data.data;
}

export async function suspendOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.patch<ApiEnvelope<Organization>>(`/organizations/${id}/suspend`);
  return data.data;
}

export async function activateOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.patch<ApiEnvelope<Organization>>(`/organizations/${id}/activate`);
  return data.data;
}
