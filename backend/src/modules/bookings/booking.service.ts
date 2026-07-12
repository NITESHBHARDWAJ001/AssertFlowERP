import { BookingStatus, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { recordActivity } from "../activity-logs/activityLog.service";
import { notify } from "../notifications/notification.service";
import type { AuthUser } from "../../middleware/authenticate";

const bookingInclude = {
  resource: { select: { id: true, name: true, type: true, location: true, capacity: true } },
  bookedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

// PENDING and APPROVED bookings both block a time slot - only REJECTED and
// CANCELLED are considered free again. Two ranges overlap when one starts
// before the other ends on both sides.
async function assertNoConflict(
  organizationId: string,
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) {
  const conflict = await prisma.booking.findFirst({
    where: {
      organizationId,
      resourceId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    throw ApiError.conflict("This resource is already booked for the selected time slot");
  }
}

interface ListFilters {
  resourceId?: string;
  from?: Date;
  to?: Date;
}

export async function listBookings(organizationId: string, filters: ListFilters) {
  return prisma.booking.findMany({
    where: {
      organizationId,
      resourceId: filters.resourceId,
      startTime: filters.to ? { lte: filters.to } : undefined,
      endTime: filters.from ? { gte: filters.from } : undefined,
    },
    orderBy: { startTime: "asc" },
    include: bookingInclude,
  });
}

interface CreateBookingInput {
  resourceId: string;
  purpose?: string;
  startTime: Date;
  endTime: Date;
}

export async function createBooking(
  organizationId: string,
  actorUserId: string,
  input: CreateBookingInput,
  ipAddress?: string
) {
  const resource = await prisma.bookableResource.findFirst({
    where: { id: input.resourceId, organizationId, deletedAt: null },
  });
  if (!resource) throw ApiError.badRequest("Resource does not belong to your organization");

  if (input.startTime < new Date()) {
    throw ApiError.badRequest("Cannot book a time slot in the past");
  }

  await assertNoConflict(organizationId, input.resourceId, input.startTime, input.endTime);

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { bookingRequiresApproval: true },
  });
  const autoApprove = org?.bookingRequiresApproval === false;

  const booking = await prisma.booking.create({
    data: {
      organizationId,
      resourceId: input.resourceId,
      bookedById: actorUserId,
      purpose: input.purpose,
      startTime: input.startTime,
      endTime: input.endTime,
      status: autoApprove ? BookingStatus.APPROVED : BookingStatus.PENDING,
      approvedAt: autoApprove ? new Date() : undefined,
    },
    include: bookingInclude,
  });

  await recordActivity({
    organizationId,
    userId: actorUserId,
    action: "CREATE_BOOKING",
    entityType: "Booking",
    entityId: booking.id,
    ipAddress,
    metadata: { resource: resource.name },
  });

  return booking;
}

export async function decideBooking(
  organizationId: string,
  actor: AuthUser,
  bookingId: string,
  approve: boolean,
  rejectionReason: string | undefined,
  ipAddress?: string
) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status !== BookingStatus.PENDING) {
    throw ApiError.badRequest("Only pending bookings can be approved or rejected");
  }

  if (approve) {
    // Re-check in case another booking was approved for an overlapping slot
    // while this one was pending.
    await assertNoConflict(organizationId, booking.resourceId, booking.startTime, booking.endTime, booking.id);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: approve ? BookingStatus.APPROVED : BookingStatus.REJECTED,
      approvedById: actor.id,
      approvedAt: new Date(),
      rejectionReason: approve ? null : rejectionReason,
    },
    include: bookingInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: approve ? "APPROVE_BOOKING" : "REJECT_BOOKING",
    entityType: "Booking",
    entityId: bookingId,
    ipAddress,
  });

  await notify({
    organizationId,
    userId: updated.bookedById,
    type: approve ? "BOOKING_APPROVED" : "BOOKING_REJECTED",
    title: approve ? "Booking approved" : "Booking rejected",
    message: `Your booking for ${updated.resource.name} was ${approve ? "approved" : "rejected"}.`,
    entityType: "Booking",
    entityId: bookingId,
  });

  return updated;
}

export async function rescheduleBooking(
  organizationId: string,
  actor: AuthUser,
  bookingId: string,
  startTime: Date,
  endTime: Date,
  ipAddress?: string
) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) throw ApiError.notFound("Booking not found");

  const isManager = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isManager && booking.bookedById !== actor.id) {
    throw ApiError.forbidden("You can only reschedule your own bookings");
  }
  if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
    throw ApiError.badRequest("Cannot reschedule a cancelled or rejected booking");
  }

  await assertNoConflict(organizationId, booking.resourceId, startTime, endTime, booking.id);

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    // Moving the time invalidates any prior approval - it needs a fresh look.
    data: { startTime, endTime, status: BookingStatus.PENDING, approvedById: null, approvedAt: null },
    include: bookingInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "RESCHEDULE_BOOKING",
    entityType: "Booking",
    entityId: bookingId,
    ipAddress,
  });

  return updated;
}

export async function cancelBooking(organizationId: string, actor: AuthUser, bookingId: string, ipAddress?: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) throw ApiError.notFound("Booking not found");

  const isManager = actor.role === Role.ORG_ADMIN || actor.role === Role.ASSET_MANAGER;
  if (!isManager && booking.bookedById !== actor.id) {
    throw ApiError.forbidden("You can only cancel your own bookings");
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
    include: bookingInclude,
  });

  await recordActivity({
    organizationId,
    userId: actor.id,
    action: "CANCEL_BOOKING",
    entityType: "Booking",
    entityId: bookingId,
    ipAddress,
  });

  return updated;
}
