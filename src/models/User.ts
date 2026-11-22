import mongoose from "mongoose";
const userSchema = new mongoose.Schema({ id: { type: String, unique: true, index: true }, name: String, email: { type: String, unique: true }, image: String, phone: String, role: { type: String, enum: ["admin", "customer"], default: "customer" }, isBlocked: { type: Boolean, default: false } }, { timestamps: true, collection: "user" });
export const User = mongoose.models.User || mongoose.model("User", userSchema);
