export const BookingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export interface Booking {
  id: string;
  organizationId: string;
  resource: { id: string; name: string; type: string; location: string | null; capacity: number | null };
  bookedBy: { id: string; firstName: string; lastName: string; email: string };
  purpose: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface CreateBookingInput {
  resourceId: string;
  purpose?: string;
  startTime: string;
  endTime: string;
}
