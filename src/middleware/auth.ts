import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { jwtVerify } from "jose";
import { auth } from "../lib/auth.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization = req.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
      if (!env.JWT_SECRET && !env.BETTER_AUTH_SECRET) throw new ApiError(503, "JWT authentication is not configured.");
      const token = authorization.slice("Bearer ".length).trim();
      const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET ?? env.BETTER_AUTH_SECRET), { algorithms: ["HS256"] });
      const userId = typeof payload.userId === "string" ? payload.userId : payload.sub;
      const role = payload.role === "admin" || payload.role === "customer" ? payload.role : undefined;
      if (!userId || !role || payload.isBlocked === true) throw new ApiError(403, "Your account cannot access protected features.");
      req.auth = { ...payload, userId, role };
      next();
      return;
    }

    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new ApiError(401, "Authentication is required.");
    const role = session.user.role;
    if ((role !== "admin" && role !== "customer") || session.user.isBlocked) throw new ApiError(403, "Your account cannot access protected features.");
    req.auth = { userId: session.user.id, role };
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
