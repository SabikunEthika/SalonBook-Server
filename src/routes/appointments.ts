import { Router } from "express";
import { z } from "zod";
import { Appointment } from "../models/Appointment.js";
import { Service } from "../models/Service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const bookingInput = z.object({ serviceId: z.string().length(24), appointmentDate: z.string().date(), timeSlot: z.string().trim().min(3).max(40), message: z.string().trim().max(500).optional() });

router.get("/mine", requireAuth, requireRole("customer"), async (req, res, next) => {
  try { const appointments = await Appointment.find({ customerId: req.auth!.userId }).populate("serviceId", "serviceName category image duration").sort({ createdAt: -1 }).lean(); res.json({ success: true, data: appointments }); } catch (error) { next(error); }
});

router.get("/", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try { const appointments = await Appointment.find().populate("serviceId", "serviceName category image").populate("customerId", "name email image").sort({ createdAt: -1 }).lean(); res.json({ success: true, data: appointments }); } catch (error) { next(error); }
});

router.post("/", requireAuth, requireRole("customer"), async (req, res, next) => {
  try {
    const input = bookingInput.parse(req.body);
    const service = await Service.findOne({ _id: input.serviceId, status: "active" }).lean();
    if (!service) throw new ApiError(404, "This service is unavailable for booking.");
    const conflict = await Appointment.exists({ serviceId: input.serviceId, appointmentDate: input.appointmentDate, timeSlot: input.timeSlot, status: { $in: ["pending", "confirmed"] } });
    if (conflict) throw new ApiError(409, "This time slot is already booked. Please choose another.");
    const appointment = await Appointment.create({ ...input, customerId: req.auth!.userId, servicePrice: service.price });
    res.status(201).json({ success: true, data: appointment });
  } catch (error) { next(error); }
});

router.patch("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const filter = req.auth!.role === "admin" ? { _id: req.params.id, status: { $in: ["pending", "confirmed"] } } : { _id: req.params.id, customerId: req.auth!.userId, status: "pending" };
    const appointment = await Appointment.findOneAndUpdate(filter, { status: "cancelled" }, { new: true });
    if (!appointment) throw new ApiError(400, "This appointment cannot be cancelled.");
    res.json({ success: true, data: appointment });
  } catch (error) { next(error); }
});

router.patch("/:id/confirm", requireAuth, requireRole("admin"), async (req, res, next) => {
  try { const appointment = await Appointment.findOneAndUpdate({ _id: req.params.id, status: "pending" }, { status: "confirmed" }, { new: true }); if (!appointment) throw new ApiError(400, "Only pending appointments can be confirmed."); res.json({ success: true, data: appointment }); } catch (error) { next(error); }
});

export { router as appointmentRouter };
