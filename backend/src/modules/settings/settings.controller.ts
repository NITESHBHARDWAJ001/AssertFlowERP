import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as settingsService from "./settings.service";

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const settings = await settingsService.getSettings(organizationId);
  return sendSuccess(res, settings);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const settings = await settingsService.updateSettings(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, settings, "Settings updated");
});
