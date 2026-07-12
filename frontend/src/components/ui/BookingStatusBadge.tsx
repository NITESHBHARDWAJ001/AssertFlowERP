import { Badge } from "./Badge";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "../../types/booking";

const STATUS_TONE: Record<BookingStatus, "green" | "red" | "amber" | "slate" | "blue"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "slate",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}
