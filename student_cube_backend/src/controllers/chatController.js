import Chat from '../models/Chat.js';
import Offer from '../models/Offer.js';
import {
  cleanupExpiredProductChats,
  getChatReadState,
  getChatWithMessages,
  markChatReadByOffer,
} from '../utils/chatService.js';
import { notifyUser } from '../utils/realtime.js';

const formatUser = (user, displayName = 'Hidden Student') => {
  const id = user?._id || user?.id || user;

  return {
    id,
    _id: id,
    name: displayName,
  };
};

const getPaidDisplayName = (user, fallback = 'Hidden Student') => {
  return user?.name || user?.username || fallback;
};

const formatChatProduct = (product) => {
  if (!product) return product;

  const data = typeof product.toObject === 'function' ? product.toObject() : { ...product };

  return {
    ...data,
    images: Array.isArray(data.images)
      ? data.images
        .map((image) => (typeof image === 'string' ? image : image?.url))
        .filter(Boolean)
      : [],
  };
};

const getChatAlias = (chat, userId) => {
  if (!userId) return "";

  return chat.aliases?.find((alias) => alias.user?.toString() === userId.toString())?.name || "";
};

export const getMyChats = async (req, res) => {
  try {
    // Removed blocking background cleanup task

    const chats = await Chat.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('product', 'title price images')
      .populate({
        path: 'offer',
        select: 'buyer seller offerPrice counterPrice status paymentStatus updatedAt',
        populate: [
          { path: 'buyer', select: '_id name username' },
          { path: 'seller', select: '_id name username' },
        ],
      })
      .lean();

    // Batch fetch offers to avoid N+1 query (PERF-07 / BUG-021)
    const productIds = [
      ...new Set(
        chats
          .map((c) => c.product?._id || c.product)
          .filter(Boolean)
          .map((id) => id.toString()),
      ),
    ];

    const allUserOffers = productIds.length > 0
      ? await Offer.find({
        product: { $in: productIds },
        $or: [
          { buyer: req.user._id },
          { seller: req.user._id },
        ],
      }).select('product buyer seller paymentStatus').lean()
      : [];

    const offersByParticipantPair = new Map();
    for (const o of allUserOffers) {
      const prodId = o.product.toString();
      const pairKey = [o.buyer.toString(), o.seller.toString()].sort().join(':');
      const lookupKey = `${prodId}:${pairKey}`;
      const bucket = offersByParticipantPair.get(lookupKey);
      if (bucket) {
        bucket.push(o);
      } else {
        offersByParticipantPair.set(lookupKey, [o]);
      }
    }

    const data = chats.map((chat) => {
      const offer = chat.offer;
      const otherUser = offer?.buyer?._id?.toString() === req.user._id.toString()
        ? offer.seller
        : offer.buyer;
      const p1 = chat.participants[0].toString();
      const p2 = chat.participants[1].toString();
      const chatProdId = (chat.product?._id || chat.product)?.toString();
      const lookupKey = chatProdId
        ? `${chatProdId}:${[p1, p2].sort().join(':')}`
        : null;
      const chatOffers = lookupKey ? (offersByParticipantPair.get(lookupKey) || []) : [];
      
      const canSendCustom = chatOffers.some((chatOffer) => chatOffer.paymentStatus === 'PAID');

      return {
        chatId: chat._id,
        offerId: offer?._id,
        product: formatChatProduct(chat.product),
        alias: getChatAlias(chat, req.user._id),
        otherUser: formatUser(
          otherUser,
          canSendCustom ? getPaidDisplayName(otherUser) : 'Hidden Student',
        ),
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        hasUnread: getChatReadState(chat, req.user._id).hasUnread,
        offerStatus: offer?.status,
        paymentStatus: offer?.paymentStatus,
        canSendCustom,
        lifecycle: {
          status: chat.productLifecycleStatus,
          message: chat.productLifecycleMessage,
          deleteAfter: chat.deleteAfter,
        },
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

export const getUnreadChatSummary = async (req, res) => {
  try {
    // Removed blocking background cleanup task

    const chats = await Chat.find({ participants: req.user._id })
      .select('lastMessageAt lastMessageSender readBy participants deleteAfter')
      .lean();

    const hasUnread = chats.some((chat) => getChatReadState(chat, req.user._id).hasUnread);

    res.status(200).json({ success: true, hasUnread });
  } catch (error) {
    console.error('Error fetching unread chat summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread chats' });
  }
};

export const markChatRead = async (req, res) => {
  try {
    const { offerId } = req.params;
    const chat = await markChatReadByOffer(offerId, req.user._id);
    notifyUser(req.user._id, { type: 'unread_changed', offerId });

    const otherParticipantId = chat.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (otherParticipantId) {
      notifyUser(otherParticipantId, { type: 'chat_read', offerId, readBy: req.user._id });
    }

    res.status(200).json({
      success: true,
      chatId: chat._id,
      hasUnread: getChatReadState(chat, req.user._id).hasUnread,
    });
  } catch (error) {
    console.error('Error marking chat read:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to mark chat as read',
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { offerId } = req.params;
    const chatData = await getChatWithMessages(offerId, req.user._id);

    res.status(200).json({
      success: true,
      chatId: chatData.chat._id,
      offerId: chatData.offer._id,
      product: formatChatProduct(chatData.offer.product),
      alias: getChatAlias(chatData.chat, req.user._id),
      buyer: formatUser(
        chatData.offer.buyer,
        chatData.canSendCustom
          ? getPaidDisplayName(chatData.offer.buyer)
          : 'Hidden Student',
      ),
      seller: formatUser(
        chatData.offer.seller,
        chatData.canSendCustom
          ? getPaidDisplayName(chatData.offer.seller)
          : 'Hidden Student',
      ),
      canSendCustom: chatData.canSendCustom,
      lockedMessage: chatData.canSendCustom
        ? null
        : "Payment is not done yet. You can't talk fully until payment is verified.",
      prePaymentMessages: chatData.prePaymentMessages,
      lifecycle: chatData.lifecycle,
      data: chatData.messages,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch chat history',
    });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { offerId } = req.params;
    
    // Import clearChatHistory here or at the top of the file
    // I need to check if it's imported at the top. Let's assume I will import it if needed.
    const { clearChatHistory } = await import('../utils/chatService.js');

    await clearChatHistory(offerId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to clear chat history',
    });
  }
};
