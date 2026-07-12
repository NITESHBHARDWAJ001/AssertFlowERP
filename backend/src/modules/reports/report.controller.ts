import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { requireOrganization } from "../../middleware/authorize";
import { getReport, type ReportType } from "./report.service";
import { sendCsv, sendExcel, sendPdf } from "./export.util";

const VALID_TYPES: ReportType[] = ["assets", "departments", "maintenance", "bookings", "audits"];

export const getReportData = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const type = req.params.type as ReportType;
  if (!VALID_TYPES.includes(type)) throw ApiError.badRequest("Unknown report type");

  const format = (req.query.format as string | undefined) ?? "json";
  const report = await getReport(organizationId, type);

  if (format === "csv") {
    return sendCsv(res, type, report.columns, report.rows);
  }
  if (format === "excel") {
    return sendExcel(res, type, report.columns, report.rows);
  }
  if (format === "pdf") {
    return sendPdf(res, type, report.title, report.columns, report.rows);
  }

  return sendSuccess(res, report);
});
