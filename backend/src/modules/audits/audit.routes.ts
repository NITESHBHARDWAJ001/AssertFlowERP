import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createAuditCycleSchema,
  cycleIdParamSchema,
  itemIdParamSchema,
  verifyItemSchema,
} from "./audit.validators";
import { closeCycle, createCycle, getCycle, listCycles, verifyItem } from "./audit.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), listCycles);
router.get("/:id", authorize(...allRoles), validate({ params: cycleIdParamSchema }), getCycle);
router.post("/", authorize(Role.ORG_ADMIN), validate({ body: createAuditCycleSchema }), createCycle);
router.patch(
  "/:id/items/:itemId",
  authorize(...allRoles),
  validate({ params: itemIdParamSchema, body: verifyItemSchema }),
  verifyItem
);
router.patch("/:id/close", authorize(Role.ORG_ADMIN), validate({ params: cycleIdParamSchema }), closeCycle);

export default router;
