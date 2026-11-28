import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    email: String,
    image: String,
    phone: String,
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "user", autoIndex: false },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);