import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
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
