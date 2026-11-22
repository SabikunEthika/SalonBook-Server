import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log("-----------------------------------");
      console.log("       SalonBook API Server");
      console.log("-----------------------------------");
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Server: http://localhost:${env.PORT}`);
      console.log(`Health: http://localhost:${env.PORT}/api/health`);
      console.log("-----------------------------------");
    });

    const shutdown = (signal: string): void => {
      console.log(`${signal} received. Shutting down gracefully.`);

      server.close(async (error) => {
        if (error) {
          console.error("Error closing HTTP server:", error);
          process.exitCode = 1;
        }

        try {
          await disconnectDatabase();
        } catch (databaseError) {
          console.error("Error disconnecting database:", databaseError);
          process.exitCode = 1;
        }

        console.log("SalonBook server shut down.");
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start SalonBook server:", error);
    process.exitCode = 1;
  }
};

void startServer();
