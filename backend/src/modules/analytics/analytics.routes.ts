import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { getAnalyticsData } from "./analytics.controller";

const router = Router();

router.use(authenticate);
router.get("/", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), getAnalyticsData);

export default router;
