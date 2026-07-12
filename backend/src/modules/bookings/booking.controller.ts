import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as bookingService from "./booking.service";

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const { resourceId, from, to } = req.query as Record<string, string | undefined>;
  const bookings = await bookingService.listBookings(organizationId, {
    resourceId,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  return sendSuccess(res, bookings);
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const booking = await bookingService.createBooking(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, booking, "Booking submitted", 201);
});

export const decideBooking = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const booking = await bookingService.decideBooking(
    organizationId,
    req.user!,
    req.params.id,
    req.body.approve,
    req.body.rejectionReason,
    getClientIp(req)
  );
  return sendSuccess(res, booking, "Decision recorded");
});

export const rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const booking = await bookingService.rescheduleBooking(
    organizationId,
    req.user!,
    req.params.id,
    req.body.startTime,
    req.body.endTime,
    getClientIp(req)
  );
  return sendSuccess(res, booking, "Booking rescheduled");
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const booking = await bookingService.cancelBooking(organizationId, req.user!, req.params.id, getClientIp(req));
  return sendSuccess(res, booking, "Booking cancelled");
});
