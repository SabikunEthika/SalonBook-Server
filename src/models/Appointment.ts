import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    customerId: { type: String, required: true, index: true },
    appointmentDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    servicePrice: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

appointmentSchema.index({ serviceId: 1, appointmentDate: 1, timeSlot: 1, status: 1 });
appointmentSchema.index({ customerId: 1, createdAt: -1 });

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
