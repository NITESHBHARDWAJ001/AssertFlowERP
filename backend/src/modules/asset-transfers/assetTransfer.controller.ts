import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as transferService from "./assetTransfer.service";

export const createTransferRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await transferService.createTransferRequest(organizationId, req.user!, req.body, getClientIp(req));
  return sendSuccess(res, request, "Transfer request submitted", 201);
});

export const listTransferRequests = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const { assetId } = req.query as Record<string, string | undefined>;
  const requests = await transferService.listTransferRequests(organizationId, req.user!, assetId);
  return sendSuccess(res, requests);
});

export const decideTransferRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await transferService.decideTransferRequest(
    organizationId,
    req.user!,
    req.params.id,
    req.body.approve,
    req.body.note,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Decision recorded");
});

export const cancelTransferRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await transferService.cancelTransferRequest(organizationId, req.user!, req.params.id, getClientIp(req));
  return sendSuccess(res, request, "Transfer request cancelled");
});
