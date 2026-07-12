import { NotificationType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

// Called inline by whichever service causes the event - fire-and-forget from
// the caller's perspective, but awaited here so failures surface in logs
// rather than silently vanishing.
export async function notify(input: CreateNotificationInput) {
  await prisma.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });
}

export async function listNotifications(organizationId: string, userId: string) {
  return prisma.notification.findMany({
    where: { organizationId, userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(organizationId: string, userId: string) {
  return prisma.notification.count({ where: { organizationId, userId, isRead: false } });
}

export async function markAsRead(organizationId: string, userId: string, id: string) {
  const notification = await prisma.notification.findFirst({ where: { id, organizationId, userId } });
  if (!notification) throw ApiError.notFound("Notification not found");

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(organizationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { organizationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
