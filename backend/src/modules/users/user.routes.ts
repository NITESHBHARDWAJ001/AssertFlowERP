import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./user.validators";
import { createUser, deleteUser, listUsers, updateUser } from "./user.controller";

const router = Router();

router.use(authenticate);

// Directory lookup is needed by anyone who assigns/transfers assets or
// reviews requests, not just Org Admin - write operations stay admin-only.
router.get("/", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD), listUsers);
router.post("/", authorize(Role.ORG_ADMIN), validate({ body: createUserSchema }), createUser);
router.patch(
  "/:id",
  authorize(Role.ORG_ADMIN),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  updateUser
);
router.delete("/:id", authorize(Role.ORG_ADMIN), validate({ params: userIdParamSchema }), deleteUser);

export default router;
