import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { serviceRouter } from "./routes/services.js";
import { appointmentRouter } from "./routes/appointments.js";
import { userRouter } from "./routes/users.js";
import { uploadRouter } from "./routes/uploads.js";
import { auth } from "./lib/auth.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

app.use("/api/auth", express.json({ limit: "1mb" }), async (req, res, next) => {
  try {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === "string") headers.set(key, value);
      if (Array.isArray(value)) headers.set(key, value.join(", "));
    });
    const request = new Request(`${env.BETTER_AUTH_URL}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    const response = await auth.handler(request);
    response.headers.forEach((value, key) => {
      if (key !== "set-cookie") res.setHeader(key, value);
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader("set-cookie", cookies);
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    next(error);
  }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SalonBook API is running.",
    service: "SalonBook Server",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/users", userRouter);
app.use("/api/uploads", uploadRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
