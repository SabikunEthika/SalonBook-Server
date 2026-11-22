import type { JwtPayload } from "jose";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload & { userId: string; role: "admin" | "customer" };
    }
  }
}

export {};
