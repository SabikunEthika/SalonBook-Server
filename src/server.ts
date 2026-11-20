import "dotenv/config";

import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log("-----------------------------------");
  console.log("       SalonBook API Server");
  console.log("-----------------------------------");
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log("-----------------------------------");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down server.");

  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
