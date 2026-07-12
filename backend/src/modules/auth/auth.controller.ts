import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getClientIp } from "../../utils/requestMeta";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import * as authService from "./auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, getClientIp(req));
  return sendSuccess(res, result, "Logged in successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  return sendSuccess(res, result, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  return sendSuccess(res, null, "Logged out successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return sendSuccess(res, null, "If an account exists for that email, a reset link has been sent");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return sendSuccess(res, null, "Password reset successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { id: req.user!.id, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      departmentId: true,
    },
  });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, user);
});
