import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

if (!env.MONGODB_URI || !env.BETTER_AUTH_SECRET) {
  throw new Error("MONGODB_URI and BETTER_AUTH_SECRET are required for authentication.");
}

const authClient = new MongoClient(env.MONGODB_URI);
const authDatabase = authClient.db(env.MONGODB_DB_NAME);

export const connectAuthDatabase = async (): Promise<void> => {
  await authClient.connect();
};

export const disconnectAuthDatabase = async (): Promise<void> => {
  await authClient.close();
};

export const auth = betterAuth({
  appName: "SalonBook",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],
  database: mongodbAdapter(authDatabase, { client: authClient }),
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
    socialProviders: {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    },
  } : {}),
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "customer", input: false },
      isBlocked: { type: "boolean", required: true, defaultValue: false, input: false },
      phone: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, role: "customer", isBlocked: false } }),
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await authDatabase.collection("user").findOne({ id: session.userId }, { projection: { isBlocked: 1 } });
          return user?.isBlocked ? false : undefined;
        },
      },
    },
  },
});
