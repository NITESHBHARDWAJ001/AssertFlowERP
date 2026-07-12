import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { requireOrganization } from "../../middleware/authorize";
import { getAnalytics } from "./analytics.service";

export const getAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const analytics = await getAnalytics(organizationId);
  return sendSuccess(res, analytics);
});
