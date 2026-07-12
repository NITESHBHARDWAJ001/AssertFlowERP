import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from "./category.validators";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./category.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE), listCategories);
router.post("/", authorize(Role.ORG_ADMIN), validate({ body: createCategorySchema }), createCategory);
router.patch(
  "/:id",
  authorize(Role.ORG_ADMIN),
  validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
  updateCategory
);
router.delete("/:id", authorize(Role.ORG_ADMIN), validate({ params: categoryIdParamSchema }), deleteCategory);

export default router;
