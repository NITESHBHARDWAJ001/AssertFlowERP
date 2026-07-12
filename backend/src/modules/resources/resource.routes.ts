import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createResourceSchema, resourceIdParamSchema, updateResourceSchema } from "./resource.validators";
import { createResource, deleteResource, listResources, updateResource } from "./resource.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), listResources);
router.post("/", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER), validate({ body: createResourceSchema }), createResource);
router.patch(
  "/:id",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: resourceIdParamSchema, body: updateResourceSchema }),
  updateResource
);
router.delete(
  "/:id",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: resourceIdParamSchema }),
  deleteResource
);

export default router;
