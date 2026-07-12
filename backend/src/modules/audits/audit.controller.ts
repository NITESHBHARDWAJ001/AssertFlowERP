import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as auditService from "./audit.service";

export const listCycles = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const cycles = await auditService.listCycles(organizationId);
  return sendSuccess(res, cycles);
});

export const getCycle = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const cycle = await auditService.getCycle(organizationId, req.params.id);
  return sendSuccess(res, cycle);
});

export const createCycle = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const cycle = await auditService.createCycle(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, cycle, "Audit cycle created", 201);
});

export const verifyItem = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const item = await auditService.verifyItem(
    organizationId,
    req.user!,
    req.params.id,
    req.params.itemId,
    req.body.status,
    req.body.notes,
    getClientIp(req)
  );
  return sendSuccess(res, item, "Item verified");
});

export const closeCycle = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const cycle = await auditService.closeCycle(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, cycle, "Audit cycle closed");
});
