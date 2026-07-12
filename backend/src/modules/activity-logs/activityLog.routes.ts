import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "@prisma/client";
import { getActivityLogs } from "./activityLog.controller";

const router = Router();

router.use(authenticate);
router.get("/", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), getActivityLogs);

export default router;
