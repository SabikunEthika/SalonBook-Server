import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token || !env.BETTER_AUTH_SECRET) throw new ApiError(401, "Authentication is required.");

    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.BETTER_AUTH_SECRET));
    const userId = typeof payload.userId === "string" ? payload.userId : payload.sub;
    const role = payload.role;
    if (!userId || (role !== "admin" && role !== "customer")) throw new ApiError(401, "Invalid authentication token.");

    req.auth = { ...payload, userId, role };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid or expired authentication token."));
  }
};

export const requireRole = (...roles: Array<"admin" | "customer">) => (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.auth || !roles.includes(req.auth.role)) return next(new ApiError(403, "You do not have permission for this action."));
  next();
};
