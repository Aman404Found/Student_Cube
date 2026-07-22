import Razorpay from "razorpay";
import crypto from "crypto";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js";     
import ReferCode from "../models/ReferCode.js"; 
import User from "../models/User.js";           

// Razorpay instance setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const createOrder = async (req, res) => {
  try {
    const { offerId } = req.body; 

    if (!offerId) {
      return res.status(400).json({ success: false, message: "Offer ID is required" });
    }
    
    // BUG-011 Fix: Validate offer and authorization
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    if (offer.buyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to pay for this offer" });
    }
    if (offer.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: "Offer is already paid" });
    }

    const options = {
      amount: 900,
      currency: "INR",
      receipt: `receipt_offer_${offerId}`,
      notes: {
        offerId: offerId.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: "Order creation failed" });
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("🔥 Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: "Server error in creating order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      offerId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !offerId) {
      return res.status(400).json({ success: false, message: "Missing required payment details" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Razorpay Secret Key missing on server" });
    }

    // Signature verification logic
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      
      // BUG-012 Fix: Verify the order details from Razorpay to prevent replay attacks
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (order.notes?.offerId !== offerId) {
        console.error("🔥 Replay Attack Detected: order offerId mismatch", { expected: offerId, actual: order.notes?.offerId });
        return res.status(400).json({ success: false, message: "Invalid payment data. Order mismatch." });
      }

      // Idempotency check
      const existingOffer = await Offer.findById(offerId);
      if (existingOffer && existingOffer.paymentStatus === 'PAID') {
        return res.status(200).json({ success: true, message: "Already paid", paymentId: existingOffer.razorpayPaymentId });
      }
      
      const updatedOffer = await Offer.findByIdAndUpdate(
        offerId, 
        {
          paymentStatus: 'PAID', 
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        },
        { new: true } 
      );

      if (!updatedOffer) {
        return res.status(404).json({ success: false, message: "Offer not found to update payment status" });
      }

      // ==========================================
      // 🔥 AMBASSADOR REWARD LOGIC START 🔥
      // ==========================================
      try {
        // Assume offer model has a 'product' or 'productId' field referencing the Product
        const productId = updatedOffer.product || updatedOffer.productId; 
        
        if (productId) {
          // BUG-014 Fix: Atomic update to prevent double-credit race condition
          const product = await Product.findOneAndUpdate(
            { _id: productId, isPromoRewarded: false, appliedPromoCode: { $exists: true, $ne: "" } },
            { $set: { isPromoRewarded: true } },
            { new: true }
          );

          if (product) {
            
            // Ambassador ka wo code nikalo jiska status abhi tak "used" hai is product ke liye
            const ambassadorCode = await ReferCode.findOne({ 
              code: product.appliedPromoCode,
              "referredUsers.productId": product._id,
              "referredUsers.status": "used"
            }).populate('owner');

            if (ambassadorCode) {
              // 1. Referral ka status "successful" karo
              await ReferCode.updateOne(
                { 
                  _id: ambassadorCode._id, 
                  "referredUsers.productId": product._id 
                },
                { 
                  $set: { "referredUsers.$.status": "successful" } 
                }
              );

              // 2. Ambassador ke wallet me commission add karo (BUG-016: ₹5)
              await User.updateOne(
                { _id: ambassadorCode.owner._id },
                { 
                  $inc: { walletBalance: 5 } 
                }
              );

              console.log("✅ Ambassador Reward Processed Successfully!");
            }
          }
        }
      } catch (rewardError) {
        console.error("⚠️ Error processing ambassador reward:", rewardError);
        // Hum yahan response break nahi kar rahe kyunki payment toh success ho chuki hai
      }
      // ==========================================
      // 🔥 AMBASSADOR REWARD LOGIC END 🔥
      // ==========================================

      res.status(200).json({ 
        success: true, 
        message: "Payment verified successfully and Chat Unlocked!",
        paymentId: razorpay_payment_id
      });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed! Fake signature." });
    }
  } catch (error) {
    console.error("🔥 Razorpay Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error in verification" });
  }
};

export const createListingOrder = async (req, res) => {
  try {
    const options = {
      amount: 900, // ₹9 listing fee
      currency: "INR",
      receipt: `receipt_listing_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: "Order creation failed" });
    }

    res.status(200).json({
      success: true,
      order: order 
    });
  } catch (error) {
    console.error("🔥 Razorpay Listing Order Error:", error);
    res.status(500).json({ success: false, message: "Server error in creating listing order" });
  }
};

// Webhook handler for server-to-server notifications
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.warn("Webhook secret not configured.");
      return res.status(200).send("OK");
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const event = req.body;
    
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const entity = event.event === 'order.paid' ? event.payload.order.entity : event.payload.payment.entity;
      const offerId = entity.notes?.offerId;
      const orderId = entity.order_id || entity.id;

      if (!offerId) return res.status(200).send("OK");

      // Idempotency check
      const existingOffer = await Offer.findById(offerId);
      if (!existingOffer || existingOffer.paymentStatus === 'PAID') {
        return res.status(200).send("OK");
      }

      // Secure verification fallback against Razorpay API
      const order = await razorpay.orders.fetch(orderId);
      if (order.status !== 'paid' || order.notes?.offerId !== offerId) {
        return res.status(400).send("Verification failed");
      }

      // Update offer
      const updatedOffer = await Offer.findByIdAndUpdate(
        offerId,
        {
          paymentStatus: 'PAID',
          razorpayPaymentId: event.payload.payment?.entity?.id,
          razorpayOrderId: orderId
        },
        { new: true }
      );

      // Process ambassador reward if applicable
      try {
        const productId = updatedOffer.product || updatedOffer.productId; 
        if (productId) {
          // BUG-014 Fix: Atomic update to prevent double-credit race condition
          const product = await Product.findOneAndUpdate(
            { _id: productId, isPromoRewarded: false, appliedPromoCode: { $exists: true, $ne: "" } },
            { $set: { isPromoRewarded: true } },
            { new: true }
          );

          if (product) {
            const ambassadorCode = await ReferCode.findOne({ 
              code: product.appliedPromoCode,
              "referredUsers.productId": product._id,
              "referredUsers.status": "used"
            }).populate('owner');

            if (ambassadorCode) {
              await ReferCode.updateOne(
                { _id: ambassadorCode._id, "referredUsers.productId": product._id },
                { $set: { "referredUsers.$.status": "successful" } }
              );
              // BUG-016 Fix: Correct payout amount and remove undefined field
              await User.updateOne(
                { _id: ambassadorCode.owner._id },
                { $inc: { walletBalance: 5 } }
              );
            }
          }
        }
      } catch (rewardError) {
        console.error("⚠️ Error processing ambassador reward in webhook:", rewardError);
      }
    }
    
    res.status(200).send("OK");
  } catch (error) {
    console.error("🔥 Razorpay Webhook Error:", error);
    res.status(500).send("Server Error");
  }
};