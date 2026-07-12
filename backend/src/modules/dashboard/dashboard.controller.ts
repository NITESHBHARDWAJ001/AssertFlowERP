import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getDashboardKpis } from "./dashboard.service";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const kpis = await getDashboardKpis(req.user!);
  return sendSuccess(res, kpis);
});
