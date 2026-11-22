import { Schema, model, models } from "mongoose";
const userSchema = new Schema({ name: String, email: { type: String, unique: true }, image: String, phone: String, role: { type: String, enum: ["admin", "customer"], default: "customer" }, isBlocked: { type: Boolean, default: false } }, { timestamps: true, collection: "user" });
export const User = models.User || model("User", userSchema);
