import { apiClient } from "./client";
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from "../types/employee";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiEnvelope<Employee[]>>("/users");
  return data.data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.post<ApiEnvelope<Employee>>("/users", input);
  return data.data;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const { data } = await apiClient.patch<ApiEnvelope<Employee>>(`/users/${id}`, input);
  return data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
