import type { Request, Response } from "express";
import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import { connectAuthDatabase } from "../src/lib/auth.js";

let ready: Promise<void> | null = null;

const init = (): Promise<void> => {
  if (!ready) {
    ready = Promise.all([connectDatabase(), connectAuthDatabase()])
      .then(() => undefined)
      .catch((error) => {
        ready = null;
        throw error;
      });
  }

  return ready;
};

export default async function handler(req: Request, res: Response) {
  try {
    await init();
  } catch (error) {
    console.error("Database initialization failed:", error);

    res.status(503).json({
      success: false,
      message: "Database is unavailable. Please try again.",
    });

    return;
  }

  return app(req, res);
}
