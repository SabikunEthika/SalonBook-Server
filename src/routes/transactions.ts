import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const transactions = await Transaction.find().populate("appointmentId", "appointmentDate timeSlot servicePrice").sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

export { router as transactionRouter };
