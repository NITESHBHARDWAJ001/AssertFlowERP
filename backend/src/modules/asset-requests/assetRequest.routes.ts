import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createRequestSchema,
  decisionSchema,
  managerDecisionSchema,
  requestIdParamSchema,
} from "./assetRequest.validators";
import {
  assetManagerDecision,
  cancelRequest,
  createRequest,
  deptHeadDecision,
  listRequests,
} from "./assetRequest.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), listRequests);
router.post("/", authorize(...allRoles), validate({ body: createRequestSchema }), createRequest);
router.patch(
  "/:id/dept-head-decision",
  authorize(Role.DEPARTMENT_HEAD, Role.ORG_ADMIN),
  validate({ params: requestIdParamSchema, body: decisionSchema }),
  deptHeadDecision
);
router.patch(
  "/:id/asset-manager-decision",
  authorize(Role.ASSET_MANAGER, Role.ORG_ADMIN),
  validate({ params: requestIdParamSchema, body: managerDecisionSchema }),
  assetManagerDecision
);
router.patch("/:id/cancel", authorize(...allRoles), validate({ params: requestIdParamSchema }), cancelRequest);

export default router;
