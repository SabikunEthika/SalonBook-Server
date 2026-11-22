import { Router } from "express";
import { z } from "zod";
import { Service } from "../models/Service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const serviceInput = z.object({
  serviceName: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(1000), price: z.coerce.number().positive(),
  duration: z.coerce.number().int().positive(), image: z.string().url(), status: z.enum(["active", "inactive"]).default("active"),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
    const query: Record<string, unknown> = {};
    if (req.query.status === "active" || req.query.status === "inactive") query.status = req.query.status;
    if (typeof req.query.category === "string" && req.query.category) query.category = req.query.category;
    if (typeof req.query.search === "string" && req.query.search.trim()) query.serviceName = { $regex: req.query.search.trim(), $options: "i" };
    const sort: Record<string, 1 | -1> = req.query.sort === "price-desc" ? { price: -1 } : req.query.sort === "price-asc" ? { price: 1 } : { createdAt: -1 };
    const [services, total] = await Promise.all([Service.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(), Service.countDocuments(query)]);
    res.json({ success: true, data: services, meta: { page, limit, total } });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try { const service = await Service.findById(req.params.id).lean(); if (!service) throw new ApiError(404, "Service not found."); res.json({ success: true, data: service }); } catch (error) { next(error); }
});
router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => { try { const service = await Service.create(serviceInput.parse(req.body)); res.status(201).json({ success: true, data: service }); } catch (error) { next(error); } });
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res, next) => { try { const service = await Service.findByIdAndUpdate(req.params.id, serviceInput.partial().parse(req.body), { new: true, runValidators: true }); if (!service) throw new ApiError(404, "Service not found."); res.json({ success: true, data: service }); } catch (error) { next(error); } });
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => { try { const service = await Service.findByIdAndDelete(req.params.id); if (!service) throw new ApiError(404, "Service not found."); res.json({ success: true, message: "Service deleted." }); } catch (error) { next(error); } });
export { router as serviceRouter };
