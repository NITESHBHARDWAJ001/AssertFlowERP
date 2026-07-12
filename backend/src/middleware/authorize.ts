import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

// Must run after `authenticate`. Gates a route to a fixed set of roles.
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

// Every non-super-admin route handler needs a concrete organizationId to
// scope Prisma queries with. This guards against the SUPER_ADMIN's null
// organizationId ever leaking into a tenant-scoped query.
export function requireOrganization(req: Request): string {
  if (!req.user?.organizationId) {
    throw ApiError.forbidden("This action requires an organization context");
  }
  return req.user.organizationId;
}
