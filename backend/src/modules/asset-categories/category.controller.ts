import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as categoryService from "./category.service";

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const categories = await categoryService.listCategories(organizationId);
  return sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const category = await categoryService.createCategory(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, category, "Category created", 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const category = await categoryService.updateCategory(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, category, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await categoryService.deleteCategory(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, null, "Category deleted");
});
