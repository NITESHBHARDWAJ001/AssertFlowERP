import { apiClient } from "./client";
import type { CreateDepartmentInput, Department, UpdateDepartmentInput } from "../types/department";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<ApiEnvelope<Department[]>>("/departments");
  return data.data;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const { data } = await apiClient.post<ApiEnvelope<Department>>("/departments", input);
  return data.data;
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput): Promise<Department> {
  const { data } = await apiClient.patch<ApiEnvelope<Department>>(`/departments/${id}`, input);
  return data.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}
