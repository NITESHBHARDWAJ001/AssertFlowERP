import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createTransferRequestSchema, decisionSchema, transferRequestIdParamSchema } from "./assetTransfer.validators";
import {
  cancelTransferRequest,
  createTransferRequest,
  decideTransferRequest,
  listTransferRequests,
} from "./assetTransfer.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), listTransferRequests);
router.post("/", authorize(...allRoles), validate({ body: createTransferRequestSchema }), createTransferRequest);
router.patch(
  "/:id/decision",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD),
  validate({ params: transferRequestIdParamSchema, body: decisionSchema }),
  decideTransferRequest
);
router.patch(
  "/:id/cancel",
  authorize(...allRoles),
  validate({ params: transferRequestIdParamSchema }),
  cancelTransferRequest
);

export default router;
