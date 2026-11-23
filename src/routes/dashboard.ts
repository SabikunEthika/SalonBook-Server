import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Appointment } from "../models/Appointment.js";
import { Service } from "../models/Service.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role === "admin") {
      const [customers, activeServices, appointments, pendingAppointments, confirmedAppointments, successfulPayments, paymentTotal] = await Promise.all([
        User.countDocuments({ role: "customer" }),
        Service.countDocuments({ status: "active" }),
        Appointment.countDocuments(),
        Appointment.countDocuments({ status: "pending" }),
        Appointment.countDocuments({ status: "confirmed" }),
        Transaction.countDocuments({ status: "paid" }),
        Transaction.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      ]);
      return res.json({ success: true, data: { role: "admin", customers, activeServices, appointments, pendingAppointments, confirmedAppointments, successfulPayments, paymentTotal: paymentTotal[0]?.total ?? 0 } });
    }
    const customerId = req.auth!.userId;
    const [appointments, pendingAppointments, confirmedAppointments, cancelledAppointments, paidAppointments] = await Promise.all([
      Appointment.countDocuments({ customerId }),
      Appointment.countDocuments({ customerId, status: "pending" }),
      Appointment.countDocuments({ customerId, status: "confirmed" }),
      Appointment.countDocuments({ customerId, status: "cancelled" }),
      Appointment.countDocuments({ customerId, paymentStatus: "paid" }),
    ]);
    res.json({ success: true, data: { role: "customer", appointments, pendingAppointments, confirmedAppointments, cancelledAppointments, paidAppointments } });
  } catch (error) { next(error); }
});

export { router as dashboardRouter };
