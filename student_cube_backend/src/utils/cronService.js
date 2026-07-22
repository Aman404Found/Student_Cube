import Offer from '../models/Offer.js';
import User from '../models/User.js';
import { recordChatMessage } from './chatService.js';
import { notifyUsers } from './realtime.js';

export const startOfferExpiryJob = () => {
  // Run every 15 minutes
  const INTERVAL_MS = 15 * 60 * 1000;

  setInterval(async () => {
    try {
      console.log('Running offer expiry check...');
      
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find all offers that have expired
      const expiredOffers = await Offer.find({
        $or: [
          { status: "pending", updatedAt: { $lt: fortyEightHoursAgo } },
          { status: "countered", updatedAt: { $lt: fortyEightHoursAgo } },
          { status: "accepted", paymentStatus: "NONE", updatedAt: { $lt: twentyFourHoursAgo } }
        ]
      });

      for (const offer of expiredOffers) {
        // Determine who gets the strike
        let atFaultUserId = null;
        if (offer.status === "pending") {
          atFaultUserId = offer.seller;
        } else if (offer.status === "countered" || offer.status === "accepted") {
          atFaultUserId = offer.buyer;
        }

        // Apply strike
        if (atFaultUserId) {
          const user = await User.findById(atFaultUserId);
          if (user) {
            user.escrowStrikes = (user.escrowStrikes || 0) + 1;
            if (user.escrowStrikes >= 10) {
              user.isSuspended = true;
            }
            await user.save();
          }
        }

        // Mark offer as failed
        offer.status = "failed";
        await offer.save();

        // Record system chat message
        await recordChatMessage({
          offer,
          sender: atFaultUserId, // Usually system, but chatService requires an ID; we'll use atFaultUserId or buyer as fallback
          text: "Offer expired due to inactivity.",
          kind: "SYSTEM",
        });

        // Notify users
        notifyUsers([offer.buyer, offer.seller], {
          type: "offer_updated",
          offerId: offer._id,
          status: offer.status,
        });
      }
      
      if (expiredOffers.length > 0) {
        console.log(`Expired ${expiredOffers.length} stale offers.`);
      }
    } catch (error) {
      console.error('Error in offer expiry job:', error);
    }
  }, INTERVAL_MS);
};
