import { Request, Response } from "express";
import { AssetStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import { getAllowedTransitions } from "./asset.stateMachine";
import * as assetService from "./asset.service";

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const { search, categoryId, status, departmentId } = req.query as Record<string, string | undefined>;
  const assets = await assetService.listAssets(organizationId, req.user!, {
    search,
    categoryId,
    status: status as AssetStatus | undefined,
    departmentId,
  });
  return sendSuccess(res, assets);
});

export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const asset = await assetService.getAsset(organizationId, req.params.id);
  return sendSuccess(res, { ...asset, allowedTransitions: getAllowedTransitions(asset.status) });
});

export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const asset = await assetService.createAsset(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, asset, "Asset registered", 201);
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const asset = await assetService.updateAsset(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, asset, "Asset updated");
});

export const transitionAssetStatus = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const asset = await assetService.transitionAssetStatus(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, asset, "Asset status updated");
});

export const returnAsset = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const asset = await assetService.returnAsset(
    organizationId,
    req.user!,
    req.params.id,
    req.body.condition,
    getClientIp(req)
  );
  return sendSuccess(res, asset, "Asset returned");
});

export const uploadAssetImages = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("No files uploaded");
  const asset = await assetService.addAssetImages(organizationId, req.user!.id, req.params.id, files, getClientIp(req));
  return sendSuccess(res, asset, "Images uploaded");
});

export const uploadAssetDocuments = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("No files uploaded");
  const asset = await assetService.addAssetDocuments(
    organizationId,
    req.user!.id,
    req.params.id,
    files,
    getClientIp(req)
  );
  return sendSuccess(res, asset, "Documents uploaded");
});

export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await assetService.deleteAsset(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, null, "Asset deleted");
});
