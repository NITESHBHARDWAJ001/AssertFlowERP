import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as departmentService from "./department.service";

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const departments = await departmentService.listDepartments(organizationId);
  return sendSuccess(res, departments);
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const department = await departmentService.createDepartment(
    organizationId,
    req.user!.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, department, "Department created", 201);
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const department = await departmentService.updateDepartment(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, department, "Department updated");
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await departmentService.deleteDepartment(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, null, "Department deleted");
});
