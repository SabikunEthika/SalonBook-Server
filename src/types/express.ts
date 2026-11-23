import type { JWTPayload } from "jose";

declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload & { userId: string; role: "admin" | "customer" };
    }
  }
}

export {};
