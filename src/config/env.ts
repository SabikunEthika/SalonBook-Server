import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  MONGODB_URI: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional()
  ),

  MONGODB_DB_NAME: z.string().default("salonbook"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(
    z.treeifyError(parsedEnv.error)
  );

  throw new Error("Environment validation failed.");
}

export const env = parsedEnv.data;
