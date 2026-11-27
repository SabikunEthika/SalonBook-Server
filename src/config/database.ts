import mongoose from "mongoose";
import { env } from "./env.js";

let databaseConnectionPromise: Promise<void> | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    console.warn(
      "MONGODB_URI is not configured. Database connection skipped."
    );
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!databaseConnectionPromise) {
    databaseConnectionPromise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 10000,
      })
      .then(() => {
        console.log("MongoDB connected successfully.");
      })
      .catch((error) => {
        databaseConnectionPromise = null;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  await databaseConnectionPromise;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
   databaseConnectionPromise = null;
    console.log("MongoDB disconnected.");
  }
};

export const getDatabaseStatus = (): string => {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] ?? "unknown";
};
