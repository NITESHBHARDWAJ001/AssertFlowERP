import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { getReportData } from "./report.controller";

const router = Router();

router.use(authenticate);
router.get("/:type", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), getReportData);

export default router;
