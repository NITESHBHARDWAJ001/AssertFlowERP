import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { requireOrganization } from "../../middleware/authorize";
import { listActivity } from "./activityLog.service";

export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const logs = await listActivity(organizationId);
  return sendSuccess(res, logs);
});
