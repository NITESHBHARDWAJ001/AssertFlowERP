import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  bookingIdParamSchema,
  createBookingSchema,
  decisionSchema,
  listBookingsQuerySchema,
  rescheduleBookingSchema,
} from "./booking.validators";
import {
  cancelBooking,
  createBooking,
  decideBooking,
  listBookings,
  rescheduleBooking,
} from "./booking.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), validate({ query: listBookingsQuerySchema }), listBookings);
router.post("/", authorize(...allRoles), validate({ body: createBookingSchema }), createBooking);
router.patch(
  "/:id/decision",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: bookingIdParamSchema, body: decisionSchema }),
  decideBooking
);
router.patch(
  "/:id/reschedule",
  authorize(...allRoles),
  validate({ params: bookingIdParamSchema, body: rescheduleBookingSchema }),
  rescheduleBooking
);
router.patch("/:id/cancel", authorize(...allRoles), validate({ params: bookingIdParamSchema }), cancelBooking);

export default router;
