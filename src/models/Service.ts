import { Schema, model, models } from "mongoose";

const serviceSchema = new Schema(
  {
    serviceName: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    image: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

serviceSchema.index({ serviceName: "text", category: "text" });

export const Service = models.Service || model("Service", serviceSchema);
