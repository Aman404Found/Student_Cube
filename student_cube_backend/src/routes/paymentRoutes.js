import express from "express";
import { createOrder, verifyPayment, createListingOrder, razorpayWebhook } from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { paymentLimiter, paymentServiceLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/create-order", protect, paymentServiceLimiter, createOrder);
router.post("/verify-signature", protect, paymentServiceLimiter, paymentLimiter, verifyPayment);
router.post("/listing-order", protect, paymentServiceLimiter, createListingOrder);

// Webhook for Razorpay server-to-server notifications
// Note: In server.js, express.json() is used globally. We'll handle signature verification carefully.
router.post("/webhook", paymentServiceLimiter, razorpayWebhook);

export default router;
