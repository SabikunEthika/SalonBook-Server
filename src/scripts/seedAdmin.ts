import "dotenv/config";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email) throw new Error("ADMIN_EMAIL is required. Sign up that email first, then run this script to promote it securely.");
if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required.");

const client = new MongoClient(env.MONGODB_URI);
try {
  await client.connect();
  const result = await client.db(env.MONGODB_DB_NAME).collection("user").updateOne({ email }, { $set: { role: "admin", isBlocked: false } });
  if (!result.matchedCount) throw new Error(`No Better Auth user found for ${email}. Create the account through the sign-up page first.`);
  console.log(`Promoted ${email} to admin.`);
} finally { await client.close(); }
