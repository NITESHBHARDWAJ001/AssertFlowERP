import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { upload } from "../../middleware/upload";
import {
  assignTechnicianSchema,
  createMaintenanceSchema,
  decisionSchema,
  maintenanceIdParamSchema,
  resolveSchema,
} from "./maintenance.validators";
import {
  assignTechnician,
  createRequest,
  decideRequest,
  getRequest,
  listRequests,
  resolveRequest,
  startProgress,
  uploadPhotos,
} from "./maintenance.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), listRequests);
router.get("/:id", authorize(...allRoles), validate({ params: maintenanceIdParamSchema }), getRequest);
router.post("/", authorize(...allRoles), validate({ body: createMaintenanceSchema }), createRequest);
router.patch(
  "/:id/decision",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: maintenanceIdParamSchema, body: decisionSchema }),
  decideRequest
);
router.patch(
  "/:id/assign-technician",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: maintenanceIdParamSchema, body: assignTechnicianSchema }),
  assignTechnician
);
router.patch(
  "/:id/start",
  authorize(...allRoles),
  validate({ params: maintenanceIdParamSchema }),
  startProgress
);
router.patch(
  "/:id/resolve",
  authorize(...allRoles),
  validate({ params: maintenanceIdParamSchema, body: resolveSchema }),
  resolveRequest
);
router.post(
  "/:id/photos",
  authorize(...allRoles),
  validate({ params: maintenanceIdParamSchema }),
  upload.array("files", 5),
  uploadPhotos
);

export default router;
