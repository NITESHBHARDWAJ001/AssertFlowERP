import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createOrganizationSchema, orgIdParamSchema } from "./organization.validators";
import {
  activateOrganization,
  createOrganization,
  listOrganizations,
  suspendOrganization,
} from "./organization.controller";

const router = Router();

router.use(authenticate, authorize(Role.SUPER_ADMIN));

router.get("/", listOrganizations);
router.post("/", validate({ body: createOrganizationSchema }), createOrganization);
router.patch("/:id/suspend", validate({ params: orgIdParamSchema }), suspendOrganization);
router.patch("/:id/activate", validate({ params: orgIdParamSchema }), activateOrganization);

export default router;
