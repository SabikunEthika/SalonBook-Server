import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    customerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    stripeSessionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["paid", "failed"], required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
