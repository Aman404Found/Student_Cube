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
    
    const options = {
      amount: 900,
      currency: "INR",
      receipt: `receipt_offer_${offerId}`,
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
          const product = await Product.findById(productId);

          // Check agar promo code use hua tha aur reward abhi tak nahi diya gaya hai
          if (product && product.appliedPromoCode && product.isPromoRewarded === false) {
            
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

              // 2. Ambassador ke wallet me commission add karo (Example: ₹4)
              await User.updateOne(
                { _id: ambassadorCode.owner._id },
                { 
                  $inc: { 
                    walletBalance: 4, 
                    referred: 1 
                  } 
                }
              );

              // 3. Product ko mark karo ki ab dobara reward na jaye
              product.isPromoRewarded = true;
              await product.save();
              
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