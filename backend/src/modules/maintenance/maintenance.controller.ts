import { Request, Response } from "express";
import { MaintenanceStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as maintenanceService from "./maintenance.service";

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const { status } = req.query as Record<string, string | undefined>;
  const requests = await maintenanceService.listRequests(organizationId, req.user!, {
    status: status as MaintenanceStatus | undefined,
  });
  return sendSuccess(res, requests);
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.getRequest(organizationId, req.params.id);
  return sendSuccess(res, request);
});

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.createRequest(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, request, "Maintenance request raised", 201);
});

export const decideRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.decideRequest(
    organizationId,
    req.user!,
    req.params.id,
    req.body.approve,
    req.body.rejectionReason,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Decision recorded");
});

export const assignTechnician = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.assignTechnician(
    organizationId,
    req.user!,
    req.params.id,
    req.body.technicianId,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Technician assigned");
});

export const startProgress = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.startProgress(organizationId, req.user!, req.params.id, getClientIp(req));
  return sendSuccess(res, request, "Work started");
});

export const resolveRequest = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const request = await maintenanceService.resolveRequest(
    organizationId,
    req.user!,
    req.params.id,
    req.body.resolution,
    getClientIp(req)
  );
  return sendSuccess(res, request, "Maintenance resolved");
});

export const uploadPhotos = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("No files uploaded");
  const request = await maintenanceService.addPhotos(organizationId, req.user!.id, req.params.id, files, getClientIp(req));
  return sendSuccess(res, request, "Photos uploaded");
});
