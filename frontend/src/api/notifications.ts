import { apiClient } from "./client";
import type { Notification, NotificationsResponse } from "../types/notification";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listNotifications(): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<ApiEnvelope<NotificationsResponse>>("/notifications");
  return data.data;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const { data } = await apiClient.patch<ApiEnvelope<Notification>>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
