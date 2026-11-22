import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")) });

router.post("/image", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
    if (!env.IMGBB_API_KEY) throw new ApiError(503, "Image uploads are not configured yet.");
    if (!req.file) throw new ApiError(400, "Please choose an image file up to 5 MB.");
    const payload = new FormData();
    payload.append("image", req.file.buffer.toString("base64"));
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`, { method: "POST", body: payload });
    const result = await response.json() as { success?: boolean; data?: { url?: string }; error?: { message?: string } };
    if (!response.ok || !result.success || !result.data?.url) throw new ApiError(502, result.error?.message ?? "ImgBB could not upload this image.");
    res.status(201).json({ success: true, data: { url: result.data.url } });
  } catch (error) { next(error); }
});

export { router as uploadRouter };
