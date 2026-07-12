import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./user.validators";
import { createUser, deleteUser, listUsers, updateUser } from "./user.controller";

const router = Router();

router.use(authenticate, authorize(Role.ORG_ADMIN));

router.get("/", listUsers);
router.post("/", validate({ body: createUserSchema }), createUser);
router.patch("/:id", validate({ params: userIdParamSchema, body: updateUserSchema }), updateUser);
router.delete("/:id", validate({ params: userIdParamSchema }), deleteUser);

export default router;
