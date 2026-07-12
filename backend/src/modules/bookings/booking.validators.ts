import { z } from "zod";

export const createBookingSchema = z
  .object({
    resourceId: z.string().min(1),
    purpose: z.string().max(500).optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const rescheduleBookingSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const decisionSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

export const bookingIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listBookingsQuerySchema = z.object({
  resourceId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
