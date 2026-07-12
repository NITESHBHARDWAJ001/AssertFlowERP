import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createDepartmentSchema,
  departmentIdParamSchema,
  updateDepartmentSchema,
} from "./department.validators";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "./department.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE),
  listDepartments
);
router.post("/", authorize(Role.ORG_ADMIN), validate({ body: createDepartmentSchema }), createDepartment);
router.patch(
  "/:id",
  authorize(Role.ORG_ADMIN),
  validate({ params: departmentIdParamSchema, body: updateDepartmentSchema }),
  updateDepartment
);
router.delete(
  "/:id",
  authorize(Role.ORG_ADMIN),
  validate({ params: departmentIdParamSchema }),
  deleteDepartment
);

export default router;
