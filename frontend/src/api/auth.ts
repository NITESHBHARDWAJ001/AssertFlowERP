import { apiClient } from "./client";
import type { AuthUser, LoginResponse } from "../types/auth";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  return data.data;
}

export interface SignupInput {
  organizationSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function signupRequest(input: SignupInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/signup", input);
  return data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>("/auth/me");
  return data.data;
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPasswordRequest(token: string, password: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, password });
}
