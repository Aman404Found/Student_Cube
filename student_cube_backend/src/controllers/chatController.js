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
    await cleanupExpiredProductChats();

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
      });

    const data = await Promise.all(chats.map(async (chat) => {
      const offer = chat.offer;
      const otherUser = offer?.buyer?._id?.toString() === req.user._id.toString()
        ? offer.seller
        : offer.buyer;
      const p1 = chat.participants[0];
      const p2 = chat.participants[1];
      
      const chatOffers = await Offer.find({
        product: chat.product?._id || chat.product,
        $or: [
          { buyer: p1, seller: p2 },
          { buyer: p2, seller: p1 }
        ]
      }).select('paymentStatus');
      
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
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

export const getUnreadChatSummary = async (req, res) => {
  try {
    await cleanupExpiredProductChats();

    const chats = await Chat.find({ participants: req.user._id })
      .select('lastMessageAt lastMessageSender readBy participants deleteAfter');

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
