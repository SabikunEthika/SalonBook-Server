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

// Important:
// Better Auth and Stripe webhook routes will be mounted
// before JSON parsing when we integrate them.

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

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
