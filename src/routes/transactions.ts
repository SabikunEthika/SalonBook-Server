import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const transactions = await Transaction.find().populate({ path: "appointmentId", select: "appointmentDate timeSlot servicePrice serviceId", populate: { path: "serviceId", select: "serviceName category image" } }).sort({ createdAt: -1 }).lean();
    const customerIds = [...new Set(transactions.map((transaction) => transaction.customerId))];
    const customers = await User.find({ id: { $in: customerIds } }).select("id name email image").lean();
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    res.json({ success: true, data: transactions.map((transaction) => ({ ...transaction, customerId: customersById.get(transaction.customerId) ?? null })) });
  } catch (error) { next(error); }
});

export { router as transactionRouter };
