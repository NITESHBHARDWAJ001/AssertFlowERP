import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { updateSettingsSchema } from "./settings.validators";
import { getSettings, updateSettings } from "./settings.controller";

const router = Router();

router.use(authenticate, authorize(Role.ORG_ADMIN));

router.get("/", getSettings);
router.patch("/", validate({ body: updateSettingsSchema }), updateSettings);

export default router;
