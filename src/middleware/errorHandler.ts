import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(
    new ApiError(
      404,
      `Route not found: ${req.method} ${req.originalUrl}`
    )
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== "production" && {
      stack: error instanceof Error ? error.stack : undefined,
    }),
  });
};
