import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import dotenv from "dotenv";
import { getOrCreateChatForOffer, recordChatMessage } from "../utils/chatService.js";
import { notifyUsers } from "../utils/realtime.js";

dotenv.config();

const formatPublicImages = (images = []) => (
  images
    .map((image) => (typeof image === "string" ? image : image?.url))
    .filter(Boolean)
);

// 1. Buyer: Make an Offer
export const makeOffer = async (req, res) => {
  try {
    const { productId, offerPrice, chatAlias } = req.body;
    const buyerId = req.user._id;
    const numericOfferPrice = Number(offerPrice);
    const trimmedChatAlias = String(chatAlias || "").trim();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    } 

    if (product.status !== "AVAILABLE") {
      return res.status(400).json({ message: "This product is not available for offers." });
    }

    if (!Number.isFinite(numericOfferPrice) || numericOfferPrice <= 0) {
      return res.status(400).json({ message: "Please provide a valid offer amount." });
    }

    const existingChat = await Chat.findOne({
      product: productId,
      participants: { $all: [buyerId, product.seller] },
    });

    if (!existingChat && !trimmedChatAlias) {
      return res.status(400).json({ message: "Please set a chat name before sending the offer." });
    }

    if (!existingChat && trimmedChatAlias.length > 40) {
      return res.status(400).json({ message: "Chat name should be 40 characters or less." });
    }

    if (numericOfferPrice > Number(product.price)) {
      return res.status(400).json({ message: "Offer cannot be more than the listing price." });
    }

    if (product.seller.toString() === buyerId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot offer on your own product!" });
    } 

    let offer = await Offer.findOne({
      buyer: buyerId,
      seller: product.seller,
      product: productId,
      paymentStatus: { $ne: "PAID" },
      status: { $in: ["pending", "countered", "rejected", "revoked", "failed", "on_hold"] },
    }).sort({ createdAt: -1 });

    if (offer) {
      offer.offerPrice = numericOfferPrice;
      offer.counterPrice = null;
      offer.status = "pending";
      offer.paymentStatus = "NONE";
      offer.transactionId = null;
      await offer.save();
    } else {
      offer = new Offer({
        buyer: buyerId,
        seller: product.seller,
        product: productId,
        offerPrice: numericOfferPrice,
        status: "pending", 
      });

      await offer.save();
    }

    const chat = await getOrCreateChatForOffer(offer, {
      aliasUserId: buyerId,
      aliasName: existingChat ? "" : trimmedChatAlias,
    });
    await recordChatMessage({
      offer,
      sender: buyerId,
      text: "Presented an offer",
      kind: "OFFER",
      metadata: {
        offerId: offer._id,
        amount: numericOfferPrice,
        status: "pending",
        buyer: offer.buyer,
        seller: offer.seller,
      },
    });
    const notifyOfferIds = [
      offer._id.toString(),
      chat.offer?.toString(),
    ].filter(Boolean);
    const uniqueNotifyOfferIds = [...new Set(notifyOfferIds)];

    uniqueNotifyOfferIds.forEach((notifyOfferId) => {
      notifyUsers([offer.buyer, offer.seller], {
        type: "chat_updated",
        offerId: notifyOfferId,
        reason: "offer_created",
      });
      notifyUsers([offer.seller], {
        type: "unread_changed",
        offerId: notifyOfferId,
      });
    });

    res.status(201).json({
      message: "Offer sent successfully to the seller!",
      offer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while making offer" });
  }
};

// 2. Seller: Respond to Offer (Accept / Reject)
export const respondToOffer = async (req, res) => {
  try {
    const { offerId, action } = req.body; // action can be 'accepted' or 'rejected'
    const sellerId = req.user._id;

    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found!" });
    } // Security Guard: Check if the logged-in user is actually the seller of this product

    if (offer.seller.toString() !== sellerId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to respond to this offer." });
    }

    if (action === "accepted" || action === "rejected") {
      offer.status = action;
      await offer.save();

      res.status(200).json({
        message: `Offer has been ${action} successfully!`,
        offer,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Must be accepted or rejected." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while responding to offer" });
  }
};

export const getProductOffers = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id; 

    const offers = await Offer.find({ product: productId, seller: sellerId })
      .populate("buyer", "_id")
      .populate("product", "college")
      .sort({ createdAt: -1 }); 

    const latestOfferByBuyer = new Map();
    offers.forEach((offer) => {
      const buyerKey = offer.buyer?._id?.toString() || offer.buyer?.toString();
      if (buyerKey && !latestOfferByBuyer.has(buyerKey)) {
        latestOfferByBuyer.set(buyerKey, offer);
      }
    });

    const sellerOffers = [...latestOfferByBuyer.values()].map((offer) => {
      const buyerName = "Interested Student";
      const campus = offer.product?.college || "Campus";

      return {
        _id: offer._id,
        offeredPrice: offer.offerPrice,
        counterPrice: offer.counterPrice,
        status: offer.status,
        paymentStatus: offer.paymentStatus,
        buyerName,
        campus,
        buyerIdentity: `${buyerName} - ${campus}`,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      };
    });

    res.status(200).json({ success: true, offers: sellerOffers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ message: "Server error while fetching offers" });
  }
};

// 🟢 1. ACCEPT DEAL
export const acceptOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const offer = await Offer.findById(id);
    if (!offer || offer.seller.toString() !== sellerId.toString()) {
      return res
        .status(404)
        .json({ message: "Offer not found or unauthorized" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Only pending offers can be accepted." });
    }

    const existingAcceptedOffer = await Offer.findOne({
      product: offer.product,
      status: "accepted"
    });

    if (existingAcceptedOffer) {
      return res.status(400).json({ message: "You have already accepted another offer for this product. Please complete or cancel it before accepting a new one." });
    }

    offer.status = "accepted";
    await offer.save();
    await recordChatMessage({
      offer,
      sender: sellerId,
      text: "Seller accepted the offer.",
      kind: "SYSTEM",
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "offer_updated",
      offerId: offer._id,
      status: offer.status,
    });

    res.status(200).json({
      success: true,
      message: "Offer accepted successfully.",
      offer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔴 2. REJECT DEAL
export const rejectOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const offer = await Offer.findById(id);
    if (!offer || offer.seller.toString() !== sellerId.toString()) {
      return res
        .status(404)
        .json({ message: "Offer not found or unauthorized" });
    }

    if (offer.status !== "pending" && offer.status !== "accepted") {
      return res.status(400).json({ message: "Only pending or accepted offers can be rejected." });
    }

    let strikeMessage = "";
    if (offer.status === "accepted") {
      const user = await User.findById(sellerId);
      if (user) {
        user.escrowStrikes = (user.escrowStrikes || 0) + 1;
        if (user.escrowStrikes >= 10) {
          user.isSuspended = true;
          strikeMessage = " You have reached 10 strikes and your account has been suspended.";
        } else {
          strikeMessage = ` You have received an escrow strike (${user.escrowStrikes}/10) for cancelling an accepted offer.`;
        }
        await user.save();
      }
    }

    offer.status = "rejected";
    await offer.save();
    await recordChatMessage({
      offer,
      sender: sellerId,
      text: "Seller rejected the offer.",
      kind: "SYSTEM",
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "offer_updated",
      offerId: offer._id,
      status: offer.status,
    });

    res
      .status(200)
      .json({ success: true, message: `Offer rejected successfully.${strikeMessage}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔵 3. COUNTER DEAL
export const counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterPrice } = req.body;
    const sellerId = req.user._id;
    const numericCounterPrice = Number(counterPrice);

    if (!Number.isFinite(numericCounterPrice) || numericCounterPrice <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid counter amount." });
    }

    const offer = await Offer.findById(id);
    if (!offer || offer.seller.toString() !== sellerId.toString()) {
      return res
        .status(404)
        .json({ message: "Offer not found or unauthorized" });
    }

    if (!["pending", "rejected", "countered"].includes(offer.status)) {
      return res.status(400).json({ message: "This offer can no longer be countered." });
    }

    const product = await Product.findById(offer.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    if (product.status !== "AVAILABLE") {
      return res.status(400).json({ message: "This product is not available for counter offers." });
    }

    if (numericCounterPrice > Number(product.price)) {
      return res.status(400).json({ message: "Counter offer cannot be more than the listing price." });
    }

    offer.status = "countered";
    offer.counterPrice = numericCounterPrice;
    await offer.save();
    await recordChatMessage({
      offer,
      sender: sellerId,
      text: `Counter offer: ₹${numericCounterPrice}`,
      kind: "COUNTER_OFFER",
      metadata: {
        offerId: offer._id,
        amount: numericCounterPrice,
        status: "countered",
        buyer: offer.buyer,
        seller: offer.seller,
      },
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "offer_updated",
      offerId: offer._id,
      status: offer.status,
    });

    res.status(200).json({
      success: true,
      message: `Counter offer of ₹${numericCounterPrice} sent to the buyer!`,
      offer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================================
// 🔵 BUYER SIDE ACTIONS
// ==========================================

// 1. GET BUYER'S CURRENT OFFER
export const getBuyerOffer = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user._id; 

    const offer = await Offer.findOne({
      product: productId,
      buyer: buyerId,
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({
      message: "Server error fetching buyer offer",
      error: error.message,
    });
  }
};

// 2. BUYER ACCEPTS COUNTER OFFER (Escrow Logic Triggers)
export const acceptCounterOffer = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Deal locking is currently disabled. Contact the seller and wait for them to mark the product as sold.",
  });
};

// 3. BUYER REJECTS COUNTER OFFER
export const rejectCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user._id;

    const offer = await Offer.findById(id);
    if (!offer || offer.buyer.toString() !== buyerId.toString()) {
      return res
        .status(404)
        .json({ message: "Offer not found or unauthorized" });
    }

    offer.status = "failed";
    await offer.save();
    await recordChatMessage({
      offer,
      sender: buyerId,
      text: "Buyer rejected the counter offer.",
      kind: "SYSTEM",
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "offer_updated",
      offerId: offer._id,
      status: offer.status,
    });

    res
      .status(200)
      .json({ success: true, message: "You rejected the counter offer." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const revokeOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user._id;

    const offer = await Offer.findById(id);
    if (!offer || offer.buyer.toString() !== buyerId.toString()) {
      return res
        .status(404)
        .json({ message: "Offer not found or unauthorized" });
    }

    if (offer.status !== "pending" && offer.status !== "accepted") {
      return res.status(400).json({ message: "Only pending or accepted offers can be revoked." });
    }

    let strikeMessage = "";
    if (offer.status === "accepted") {
      const user = await User.findById(buyerId);
      if (user) {
        user.escrowStrikes = (user.escrowStrikes || 0) + 1;
        if (user.escrowStrikes >= 10) {
          user.isSuspended = true;
          strikeMessage = " You have reached 10 strikes and your account has been suspended.";
        } else {
          strikeMessage = ` You have received an escrow strike (${user.escrowStrikes}/10) for revoking an accepted offer.`;
        }
        await user.save();
      }
    }

    offer.status = "revoked";
    await offer.save();
    await recordChatMessage({
      offer,
      sender: buyerId,
      text: "Buyer revoked the offer.",
      kind: "SYSTEM",
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "offer_updated",
      offerId: offer._id,
      status: offer.status,
    });

    res.status(200).json({
      success: true,
      message: `Offer revoked successfully.${strikeMessage}`,
      offer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitPaymentProof = async (req, res) => {
  try {
    const { offerId, transactionId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!transactionId) {
      return res
        .status(400)
        .json({ success: false, message: "Transaction ID/UTR is required" });
    }

    const offer = await Offer.findOne({ _id: offerId, buyer: userId });
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found or unauthorized" });
    }

    if (offer.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "This deal is not locked yet. Cannot pay.",
      });
    } // Update Offer with transaction details

    offer.transactionId = transactionId;
    offer.paymentStatus = "PENDING_VERIFICATION";
    await offer.save();
    await recordChatMessage({
      offer,
      sender: userId,
      text: "Payment proof submitted. Waiting for admin verification.",
      kind: "PAYMENT",
    });
    notifyUsers([offer.buyer, offer.seller], {
      type: "payment_updated",
      offerId: offer._id,
      paymentStatus: offer.paymentStatus,
    });

    res.status(200).json({
      success: true,
      message:
        "Payment proof submitted successfully! Admin will verify shortly.",
      data: offer,
    });
  } catch (error) {
    console.error("Error submitting payment proof:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while submitting proof" });
  }
};

export const verifyPaymentAdmin = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'
    // Strict Admin authorization check if needed (e.g., req.user.role === 'admin')

    const offer = await Offer.findById(offerId).populate("product");
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    if (action === "APPROVE") {
      // 1. Mark Offer as Paid
      offer.paymentStatus = "PAID";
      offer.paidAt = new Date();
      await offer.save(); // 2. Change Product Status to SOLD_OUT completely 
      await recordChatMessage({
        offer,
        sender: offer.seller,
        text: "Payment verified. Full chat is now unlocked.",
        kind: "PAYMENT",
      });
      notifyUsers([offer.buyer, offer.seller], {
        type: "payment_updated",
        offerId: offer._id,
        paymentStatus: offer.paymentStatus,
      });

      await Product.findByIdAndUpdate(offer.product._id, {
        status: "SOLD_OUT",
        soldAt: new Date(),
      }); // 3. (Optional) Reject all other pending/countered offers on this product automatically

      await Offer.updateMany(
        { product: offer.product._id, _id: { $ne: offerId } },
        { status: "rejected" },
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified! Product marked as SOLD OUT.",
      });
    } else if (action === "REJECT") {
      // If fake UTR, put back to ACCEPTED state so buyer can retry or walk away
      offer.paymentStatus = "REJECTED";
      offer.transactionId = null; // Clear bad UTR
      await offer.save();
      await recordChatMessage({
        offer,
        sender: offer.seller,
        text: "Payment proof rejected. Please submit a valid payment proof.",
        kind: "PAYMENT",
      });
      notifyUsers([offer.buyer, offer.seller], {
        type: "payment_updated",
        offerId: offer._id,
        paymentStatus: offer.paymentStatus,
      });

      return res.status(200).json({
        success: true,
        message: "Payment proof rejected. Notification sent to buyer.",
      });
    }

    res.status(400).json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during verification" });
  }
};

// 👑 ADMIN: Fetch all offers awaiting payment verification
export const getPendingPaymentsAdmin = async (req, res) => {
  try {
    const pendingOffers = await Offer.find({
      paymentStatus: "PENDING_VERIFICATION",
    })
      .sort({ updatedAt: -1 })
      .populate("buyer", "username email")
      .populate("product", "title price images code");

    res.status(200).json({
      success: true,
      count: pendingOffers.length,
      data: pendingOffers,
    });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending payments",
    });
  }
};

// GET MY OFFERS: Fetch all offers made by the logged-in user
export const getMyOffersList = async (req, res) => {
  try {
    const offers = await Offer.find({ buyer: req.user._id })
      .populate("product", "title price images status condition category")
      .sort({ updatedAt: -1 });
    const data = offers.map((offer) => {
      const offerData = offer.toObject();

      if (offerData.product?.images) {
        offerData.product.images = formatPublicImages(offerData.product.images);
      }

      return offerData;
    });

    res.status(200).json({
      success: true,
      count: offers.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching user offers:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your offers" });
  }
};
