import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Offer from '../models/Offer.js';
import { notifyUsers } from './realtime.js';

const COMMON_PRE_PAYMENT_MESSAGES = [
  'Yes',
  'No',
  'Finalize the deal?',
  'Please accept or counter my offer.',
  'Present an offer',
];

const BUYER_PRE_PAYMENT_MESSAGES = [
  ...COMMON_PRE_PAYMENT_MESSAGES,
  'Is this item still available?',
  'I am interested in this item.',
  'Should I get the full chat access now?',
];

const SELLER_PRE_PAYMENT_MESSAGES = [
  ...COMMON_PRE_PAYMENT_MESSAGES,
  'This item is not available for sale now.',
  "I've finalized the deal with someone else.",
  'Get the full chat access for ease.',
];

const getId = (value) => value?._id || value;
const idsEqual = (a, b) => getId(a)?.toString() === getId(b)?.toString();
const CHAT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const formatPublicImages = (images = []) => (
  images
    .map((image) => (typeof image === 'string' ? image : image?.url))
    .filter(Boolean)
);
const formatChatUserIdentity = (user, revealName = false) => {
  const id = getId(user);
  const identity = {
    _id: id,
    id,
  };

  if (revealName) {
    identity.name = user?.name || user?.username || 'Student';
  }

  return identity;
};
const formatOfferForChat = (offer, revealNames = false) => {
  const data = typeof offer?.toObject === 'function' ? offer.toObject() : { ...offer };

  if (data.product?.images) {
    data.product.images = formatPublicImages(data.product.images);
  }

  data.buyer = formatChatUserIdentity(data.buyer, revealNames);
  data.seller = formatChatUserIdentity(data.seller, revealNames);

  return data;
};

const getPrePaymentMessagesForUser = (offer, userId) => {
  if (idsEqual(offer.buyer, userId)) {
    return BUYER_PRE_PAYMENT_MESSAGES;
  }

  if (idsEqual(offer.seller, userId)) {
    return SELLER_PRE_PAYMENT_MESSAGES;
  }

  return COMMON_PRE_PAYMENT_MESSAGES;
};

const isAllowedPrePaymentMessage = (offer, senderId, text) => {
  return getPrePaymentMessagesForUser(offer, senderId).includes(text);
};

export const getChatReadState = (chat, userId) => {
  const lastSenderId = getId(chat.lastMessageSender)?.toString();
  const currentUserId = getId(userId)?.toString();

  if (!chat.lastMessageAt || !lastSenderId || lastSenderId === currentUserId) {
    return { hasUnread: false, lastReadAt: null };
  }

  const readEntry = chat.readBy?.find((entry) => idsEqual(entry.user, userId));
  const lastReadAt = readEntry?.lastReadAt || null;

  return {
    hasUnread: !lastReadAt || chat.lastMessageAt > lastReadAt,
    lastReadAt,
  };
};

const getParticipantReadAt = (chat, userId) => {
  return chat.readBy?.find((entry) => idsEqual(entry.user, userId))?.lastReadAt || null;
};

const getMessageDeliveryStatus = (message, chat) => {
  if (message.isRead) return 'read';

  const receiverReadAt = getParticipantReadAt(chat, message.receiver);
  if (receiverReadAt && message.createdAt <= receiverReadAt) return 'read';

  return 'sent';
};

const formatMessageForChat = (message, chat, offer) => {
  const messageObject = typeof message.toObject === 'function'
    ? message.toObject()
    : message;
  const metadata = { ...(messageObject.metadata || {}) };

  if (messageObject.kind === 'OFFER' || messageObject.kind === 'COUNTER_OFFER') {
    metadata.offerId = metadata.offerId ?? getId(offer?._id);
    metadata.amount = metadata.amount ?? (
      messageObject.kind === 'COUNTER_OFFER'
        ? offer?.counterPrice
        : offer?.offerPrice
    );
    metadata.status = metadata.status ?? offer?.status;
    metadata.currentStatus = offer?.status;
    metadata.buyer = metadata.buyer ?? getId(offer?.buyer);
    metadata.seller = metadata.seller ?? getId(offer?.seller);
  }

  return {
    ...messageObject,
    metadata,
    deliveryStatus: getMessageDeliveryStatus(messageObject, chat),
  };
};

export const isChatParticipant = (chat, userId) => {
  return chat.participants.some((participant) => idsEqual(participant, userId));
};

export const getReceiverId = (offer, senderId) => {
  if (idsEqual(offer.buyer, senderId)) return getId(offer.seller);
  if (idsEqual(offer.seller, senderId)) return getId(offer.buyer);
  return null;
};

export const getOrCreateChatForOffer = async (offer, options = {}) => {
  const existingChat = await Chat.findOne({ offer: offer._id });
  if (existingChat) return existingChat;

  const sharedChat = await Chat.findOne({
    product: getId(offer.product),
    participants: { $all: [getId(offer.buyer), getId(offer.seller)] },
  });
  if (sharedChat) return sharedChat;

  const now = new Date();

  return Chat.create({
    offer: offer._id,
    product: getId(offer.product),
    participants: [getId(offer.buyer), getId(offer.seller)],
    lastMessage: '',
    lastMessageAt: now,
    readBy: [
      { user: getId(offer.buyer), lastReadAt: now },
      { user: getId(offer.seller), lastReadAt: now },
    ],
    aliases: options.aliasName
      ? [{ user: getId(options.aliasUserId || offer.buyer), name: options.aliasName }]
      : [],
  });
};

const getChatOffers = async (chat) => {
  const p1 = getId(chat.participants[0]);
  const p2 = getId(chat.participants[1]);

  return Offer.find({
    product: getId(chat.product),
    $or: [
      { buyer: p1, seller: p2 },
      { buyer: p2, seller: p1 }
    ]
  });
};

const findChatByOffer = async (offerId) => {
  const directChat = await Chat.findOne({ offer: offerId });
  if (directChat) return directChat;

  const offer = await Offer.findById(offerId);
  if (!offer) return null;

  return Chat.findOne({
    product: getId(offer.product),
    participants: { $all: [getId(offer.buyer), getId(offer.seller)] },
  });
};

export const cleanupExpiredProductChats = async () => {
  const expiredChats = await Chat.find({
    deleteAfter: { $ne: null, $lte: new Date() },
  }).select('_id offer product participants');

  if (expiredChats.length === 0) return 0;

  const chatIds = expiredChats.map((chat) => chat._id);
  const offerIdSet = new Set();
  for (const chat of expiredChats) {
    const chatOffers = await getChatOffers(chat);
    chatOffers.forEach((offer) => offerIdSet.add(offer._id.toString()));
  }
  const offerIds = [...offerIdSet];
  await Message.deleteMany({ chat: { $in: chatIds } });
  await Chat.deleteMany({ _id: { $in: chatIds } });
  if (offerIds.length > 0) {
    await Offer.deleteMany({ _id: { $in: offerIds } });
  }

  return chatIds.length;
};

const deleteExpiredChatWithOffer = async (chat) => {
  await Message.deleteMany({ chat: chat._id });
  await Chat.deleteOne({ _id: chat._id });
  const chatOffers = await getChatOffers(chat);
  const offerIds = chatOffers.map((offer) => offer._id);
  if (offerIds.length > 0) {
    await Offer.deleteMany({ _id: { $in: offerIds } });
  }
};

export const recordChatMessage = async ({
  offer,
  sender,
  text,
  kind = 'SYSTEM',
  metadata = {},
}) => {
  const chat = await getOrCreateChatForOffer(offer);
  const receiver = getReceiverId(offer, sender);

  if (!receiver) {
    throw new Error('Sender is not a participant in this chat.');
  }

  const message = await Message.create({
    chat: chat._id,
    offerId: offer._id,
    sender,
    receiver,
    text,
    kind,
    metadata,
  });

  chat.lastMessage = text;
  chat.lastMessageAt = message.createdAt;
  chat.lastMessageSender = getId(sender);
  await chat.save();

  return message;
};

export const markChatReadByOffer = async (offerId, userId) => {
  await cleanupExpiredProductChats();

  const chat = await findChatByOffer(offerId);
  if (!chat) {
    const error = new Error('Chat not found.');
    error.status = 404;
    throw error;
  }

  if (chat.deleteAfter && chat.deleteAfter <= new Date()) {
    await deleteExpiredChatWithOffer(chat);

    const error = new Error('This chat has expired.');
    error.status = 410;
    throw error;
  }

  if (!isChatParticipant(chat, userId)) {
    const error = new Error('You are not part of this chat.');
    error.status = 403;
    throw error;
  }

  const readAt = new Date();
  const existingRead = chat.readBy.find((entry) => idsEqual(entry.user, userId));
  if (existingRead) {
    existingRead.lastReadAt = readAt;
  } else {
    chat.readBy.push({ user: getId(userId), lastReadAt: readAt });
  }

  await chat.save();
  await Message.updateMany(
    { chat: chat._id, receiver: getId(userId), createdAt: { $lte: readAt } },
    { isRead: true },
  );

  return chat;
};

export const markProductChatsForLifecycle = async ({ productId, status, message }) => {
  const offers = await Offer.find({ product: productId });

  if (offers.length === 0) return 0;

  const deleteAfter = new Date(Date.now() + CHAT_RETENTION_MS);
  let markedCount = 0;
  const markedChatIds = new Set();

  for (const offer of offers) {
    try {
      const chat = await getOrCreateChatForOffer(offer);
      const chatId = chat._id.toString();
      if (markedChatIds.has(chatId)) {
        continue;
      }

      await recordChatMessage({
        offer,
        sender: getId(offer.seller),
        text: message,
        kind: 'SYSTEM',
        metadata: {
          productLifecycleStatus: status,
          deleteAfter,
        },
      });

      await Chat.updateOne(
        { _id: chat._id },
        {
          productLifecycleStatus: status,
          productLifecycleMessage: message,
          deleteAfter,
        },
      );

      markedCount += 1;
      markedChatIds.add(chatId);
      notifyUsers([offer.buyer, offer.seller], {
        type: 'chat_updated',
        offerId: offer._id,
        reason: status,
      });
    } catch (error) {
      console.error(`Failed to mark chat lifecycle for offer ${offer._id}:`, error);
    }
  }

  return markedCount;
};

export const sendChatMessage = async ({ offerId, senderId, text, kind = 'CUSTOM' }) => {
  await cleanupExpiredProductChats();

  const offer = await Offer.findById(offerId);
  if (!offer) {
    const error = new Error('Offer not found.');
    error.status = 404;
    throw error;
  }

  const chat = await getOrCreateChatForOffer(offer);
  if (chat.deleteAfter && chat.deleteAfter <= new Date()) {
    await deleteExpiredChatWithOffer(chat);

    const error = new Error('This chat has expired.');
    error.status = 410;
    throw error;
  }

  if (!isChatParticipant(chat, senderId)) {
    const error = new Error('You are not part of this chat.');
    error.status = 403;
    throw error;
  }

  const trimmedText = String(text || '').trim();
  if (!trimmedText) {
    const error = new Error('Message cannot be empty.');
    error.status = 400;
    throw error;
  }

  const chatOffers = await getChatOffers(chat);
  const canSendCustom = chatOffers.some((chatOffer) => chatOffer.paymentStatus === 'PAID');

  if (!canSendCustom) {
    if (kind !== 'PREDEFINED' || !isAllowedPrePaymentMessage(offer, senderId, trimmedText)) {
      const error = new Error("Payment is not done yet. You can't talk fully until payment is verified.");
      error.status = 403;
      throw error;
    }
  }

  return recordChatMessage({
    offer,
    sender: senderId,
    text: trimmedText,
    kind: canSendCustom ? 'CUSTOM' : 'PREDEFINED',
  });
};

export const getChatWithMessages = async (offerId, userId) => {
  await cleanupExpiredProductChats();

  const offer = await Offer.findById(offerId)
    .populate('product', '_id title price images')
    .populate('buyer', '_id name username')
    .populate('seller', '_id name username');

  if (!offer) {
    const error = new Error('Offer not found.');
    error.status = 404;
    throw error;
  }

  const chat = await getOrCreateChatForOffer(offer);
  if (chat.deleteAfter && chat.deleteAfter <= new Date()) {
    await deleteExpiredChatWithOffer(chat);

    const error = new Error('This chat has expired.');
    error.status = 410;
    throw error;
  }

  if (!isChatParticipant(chat, userId)) {
    const error = new Error('You are not part of this chat.');
    error.status = 403;
    throw error;
  }

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .populate('sender', '_id name username')
    .populate('receiver', '_id name username');

  const messageOfferIds = [
    ...new Set(messages.map((message) => getId(message.offerId)?.toString()).filter(Boolean)),
  ];
  const messageOffers = await Offer.find({ _id: { $in: messageOfferIds } });
  const offersById = new Map(
    messageOffers.map((messageOffer) => [messageOffer._id.toString(), messageOffer]),
  );

  const chatOffers = await getChatOffers(chat);
  const canSendCustom = chatOffers.some((chatOffer) => chatOffer.paymentStatus === 'PAID');

  const formattedMessages = messages.map((message) => {
    const messageOfferId = getId(message.offerId)?.toString();
    const formattedMessage = formatMessageForChat(message, chat, offersById.get(messageOfferId) || offer);

    return {
      ...formattedMessage,
      sender: formatChatUserIdentity(formattedMessage.sender, canSendCustom),
      receiver: formatChatUserIdentity(formattedMessage.receiver, canSendCustom),
    };
  });

  return {
    chat,
    offer: formatOfferForChat(offer, canSendCustom),
    messages: formattedMessages,
    canSendCustom,
    prePaymentMessages: getPrePaymentMessagesForUser(offer, userId),
    lifecycle: {
      status: chat.productLifecycleStatus,
      message: chat.productLifecycleMessage,
      deleteAfter: chat.deleteAfter,
    },
  };
};
