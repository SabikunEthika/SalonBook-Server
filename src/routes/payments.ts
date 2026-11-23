import { Router, type Request, type Response, type NextFunction } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { getAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { Appointment } from "../models/Appointment.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

router.post("/checkout/:appointmentId", requireAuth, requireRole("customer"), async (req, res, next) => {
  try {
    if (!stripe) throw new ApiError(503, "Payments are not configured yet.");
    const customerId = getAuth(req).userId;
    const appointment = await Appointment.findOne({ _id: req.params.appointmentId, customerId, status: "confirmed", paymentStatus: "unpaid" }).populate("serviceId", "serviceName").lean();
    if (!appointment) throw new ApiError(400, "Only your confirmed, unpaid appointments can be paid.");
    const service = appointment.serviceId as unknown as { serviceName?: string } | null;
    const session = await stripe.checkout.sessions.create({ mode: "payment", client_reference_id: String(appointment._id), metadata: { appointmentId: String(appointment._id), customerId }, line_items: [{ quantity: 1, price_data: { currency: env.STRIPE_CURRENCY, unit_amount: Math.round(appointment.servicePrice * 100), product_data: { name: service?.serviceName ?? "Salon appointment" } } }], success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${env.CLIENT_URL}/payment/cancel` });
    if (!session.url) throw new ApiError(502, "Stripe did not return a checkout URL.");
    res.json({ success: true, data: { url: session.url } });
  } catch (error) { next(error); }
});

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) throw new ApiError(503, "Stripe webhook is not configured yet.");
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") throw new ApiError(400, "Missing Stripe signature.");
    const event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;
      const customerId = session.metadata?.customerId;
      if (!appointmentId || !customerId) throw new ApiError(400, "Stripe session is missing appointment metadata.");
      await Transaction.findOneAndUpdate({ stripeSessionId: session.id }, { $setOnInsert: { appointmentId, customerId, amount: (session.amount_total ?? 0) / 100, currency: session.currency ?? env.STRIPE_CURRENCY, stripeSessionId: session.id, status: "paid" } }, { upsert: true, new: true });
      await Appointment.findOneAndUpdate({ _id: appointmentId, customerId, status: "confirmed" }, { paymentStatus: "paid" });
    }
    res.json({ received: true });
  } catch (error) { next(error); }
}

export { router as paymentRouter };
