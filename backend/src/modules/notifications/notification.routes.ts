import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { z } from "zod";
import { listNotifications, markAllAsRead, markAsRead } from "./notification.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];
const idParamSchema = z.object({ id: z.string().min(1) });

router.use(authenticate);

router.get("/", authorize(...allRoles), listNotifications);
router.patch("/:id/read", authorize(...allRoles), validate({ params: idParamSchema }), markAsRead);
router.patch("/read-all", authorize(...allRoles), markAllAsRead);

export default router;
