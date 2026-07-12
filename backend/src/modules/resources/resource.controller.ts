import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as resourceService from "./resource.service";

export const listResources = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const resources = await resourceService.listResources(organizationId);
  return sendSuccess(res, resources);
});

export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const resource = await resourceService.createResource(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, resource, "Resource created", 201);
});

export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const resource = await resourceService.updateResource(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, resource, "Resource updated");
});

export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await resourceService.deleteResource(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, null, "Resource deleted");
});
