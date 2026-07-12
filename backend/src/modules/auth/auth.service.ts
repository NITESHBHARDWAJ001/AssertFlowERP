import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { comparePassword, hashPassword, hashToken, randomToken } from "../../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { env } from "../../config/env";
import { recordActivity } from "../activity-logs/activityLog.service";
import { sendMail } from "../../utils/mailer";

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string | null;
  };
}

export async function login(email: string, password: string, ipAddress?: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (user.organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (!org || org.status === "SUSPENDED" || org.deletedAt) {
      throw ApiError.forbidden("Your organization account is suspended");
    }
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    organizationId: user.organizationId,
  });

  const refreshRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "", // placeholder, patched below once we know the jti
      expiresAt: new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, jti: refreshRecord.id });

  await prisma.refreshToken.update({
    where: { id: refreshRecord.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  await recordActivity({
    organizationId: user.organizationId,
    userId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
}

export async function refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!record || record.revokedAt || record.tokenHash !== hashToken(token) || record.expiresAt < new Date()) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findFirst({ where: { id: record.userId, deletedAt: null, isActive: true } });
  if (!user) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  // Rotate: revoke the old token and issue a new pair, so a stolen refresh
  // token can only be replayed once before detection.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const newRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "",
      expiresAt: new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000),
    },
  });

  const newRefreshToken = signRefreshToken({ sub: user.id, jti: newRecord.id });
  await prisma.refreshToken.update({ where: { id: newRecord.id }, data: { tokenHash: hashToken(newRefreshToken) } });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    organizationId: user.organizationId,
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(token);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Already invalid/expired - logout is idempotent either way.
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null, isActive: true } });
  // Always respond as if it succeeded to avoid leaking which emails exist.
  if (!user) return;

  const token = randomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your AssetFlow password",
    html: `<p>Hi ${user.firstName},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Revoke all outstanding refresh tokens so other sessions are logged out.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
