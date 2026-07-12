import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { requireOrganization } from "../../middleware/authorize";
import * as notificationService from "./notification.service";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const [notifications, unreadCount] = await Promise.all([
    notificationService.listNotifications(organizationId, req.user!.id),
    notificationService.getUnreadCount(organizationId, req.user!.id),
  ]);
  return sendSuccess(res, { notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  const notification = await notificationService.markAsRead(organizationId, req.user!.id, req.params.id);
  return sendSuccess(res, notification);
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganization(req);
  await notificationService.markAllAsRead(organizationId, req.user!.id);
  return sendSuccess(res, null, "All notifications marked as read");
});
