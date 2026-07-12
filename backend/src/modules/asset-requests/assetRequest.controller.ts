import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as assetRequestService from "./assetRequest.service";

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const requests = await assetRequestService.listRequests(organizationId, req.user!);
  return sendSuccess(res, requests);
});

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await assetRequestService.createRequest(organizationId, req.user!, req.body, getClientIp(req));
  return sendSuccess(res, request, "Asset request submitted", 201);
});

export const deptHeadDecision = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await assetRequestService.deptHeadDecision(
    organizationId,
    req.user!,
    req.params.id,
    req.body.approve,
    req.body.note,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Decision recorded");
});

export const assetManagerDecision = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await assetRequestService.assetManagerDecision(
    organizationId,
    req.user!,
    req.params.id,
    req.body.approve,
    req.body.note,
    req.body.assetId,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Decision recorded");
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await assetRequestService.cancelRequest(organizationId, req.user!, req.params.id, getClientIp(req));
  return sendSuccess(res, request, "Request cancelled");
});
