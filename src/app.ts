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
import { paymentRouter, stripeWebhook } from "./routes/payments.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { transactionRouter } from "./routes/transactions.js";
import { auth, connectAuthDatabase } from "./lib/auth.js";
import { connectDatabase } from "./config/database.js";

const app = express();
let databaseInitialization: Promise<void> | null = null;

const initializeDatabases = (): Promise<void> => {
  if (!databaseInitialization) {
    databaseInitialization = Promise.all([
      connectDatabase(),
      connectAuthDatabase(),
    ])
      .then(() => undefined)
      .catch((error) => {
        databaseInitialization = null;
        throw error;
      });
  }

  return databaseInitialization;
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

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
app.use("/api", async (req, res, next) => {
  // The health endpoint should remain available independently.
  if (req.path === "/health") {
    return next();
  }

  try {
    await initializeDatabases();
    next();
  } catch (error) {
    console.error("Database initialization failed:", error);

    res.status(503).json({
      success: false,
      message: "Database is unavailable. Please try again.",
    });
  }
});

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

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
app.use("/api/payments", paymentRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/transactions", transactionRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;
