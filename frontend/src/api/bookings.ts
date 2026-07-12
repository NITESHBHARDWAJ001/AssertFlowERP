import { apiClient } from "./client";
import type { Booking, CreateBookingInput } from "../types/booking";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function listBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<ApiEnvelope<Booking[]>>("/bookings");
  return data.data;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const { data } = await apiClient.post<ApiEnvelope<Booking>>("/bookings", input);
  return data.data;
}

export async function decideBooking(id: string, approve: boolean, rejectionReason?: string): Promise<Booking> {
  const { data } = await apiClient.patch<ApiEnvelope<Booking>>(`/bookings/${id}/decision`, {
    approve,
    rejectionReason,
  });
  return data.data;
}

export async function rescheduleBooking(id: string, startTime: string, endTime: string): Promise<Booking> {
  const { data } = await apiClient.patch<ApiEnvelope<Booking>>(`/bookings/${id}/reschedule`, {
    startTime,
    endTime,
  });
  return data.data;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<ApiEnvelope<Booking>>(`/bookings/${id}/cancel`);
  return data.data;
}
