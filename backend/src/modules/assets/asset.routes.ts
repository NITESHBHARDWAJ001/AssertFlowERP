import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { upload } from "../../middleware/upload";
import {
  assetIdParamSchema,
  createAssetSchema,
  listAssetsQuerySchema,
  returnAssetSchema,
  transitionStatusSchema,
  updateAssetSchema,
} from "./asset.validators";
import {
  createAsset,
  deleteAsset,
  getAsset,
  listAssets,
  returnAsset,
  transitionAssetStatus,
  updateAsset,
  uploadAssetDocuments,
  uploadAssetImages,
} from "./asset.controller";

const router = Router();
const allRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE];

router.use(authenticate);

router.get("/", authorize(...allRoles), validate({ query: listAssetsQuerySchema }), listAssets);
router.get("/:id", authorize(...allRoles), validate({ params: assetIdParamSchema }), getAsset);
router.post(
  "/",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ body: createAssetSchema }),
  createAsset
);
router.patch(
  "/:id",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: assetIdParamSchema, body: updateAssetSchema }),
  updateAsset
);
router.patch(
  "/:id/status",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: assetIdParamSchema, body: transitionStatusSchema }),
  transitionAssetStatus
);
router.post(
  "/:id/return",
  authorize(...allRoles),
  validate({ params: assetIdParamSchema, body: returnAssetSchema }),
  returnAsset
);
router.post(
  "/:id/images",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: assetIdParamSchema }),
  upload.array("files", 5),
  uploadAssetImages
);
router.post(
  "/:id/documents",
  authorize(Role.ORG_ADMIN, Role.ASSET_MANAGER),
  validate({ params: assetIdParamSchema }),
  upload.array("files", 5),
  uploadAssetDocuments
);
router.delete("/:id", authorize(Role.ORG_ADMIN), validate({ params: assetIdParamSchema }), deleteAsset);

export default router;
