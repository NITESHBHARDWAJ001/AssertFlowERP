import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { requireOrganization } from "../../middleware/authorize";
import * as userService from "./user.service";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const users = await userService.listUsers(organizationId);
  return sendSuccess(res, users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const user = await userService.createUser(organizationId, req.user!.id, req.body, getClientIp(req));
  return sendSuccess(res, user, "Employee created", 201);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const user = await userService.updateUser(
    organizationId,
    req.user!.id,
    req.params.id,
    req.body,
    getClientIp(req)
  );
  return sendSuccess(res, user, "Employee updated");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await userService.deleteUser(organizationId, req.user!.id, req.params.id, getClientIp(req));
  return sendSuccess(res, null, "Employee deactivated");
});
