import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import * as organizationService from "./organization.service";

export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization({
    ...req.body,
    actorUserId: req.user!.id,
    ipAddress: getClientIp(req),
  });
  return sendSuccess(res, organization, "Organization created", 201);
});

export const listOrganizations = asyncHandler(async (_req: Request, res: Response) => {
  const organizations = await organizationService.listOrganizations();
  return sendSuccess(res, organizations);
});

export const suspendOrganization = asyncHandler(async (req: Request, res: Response) => {
  const org = await organizationService.suspendOrganization(req.params.id, req.user!.id, getClientIp(req));
  return sendSuccess(res, org, "Organization suspended");
});

export const activateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const org = await organizationService.activateOrganization(req.params.id, req.user!.id, getClientIp(req));
  return sendSuccess(res, org, "Organization activated");
});
