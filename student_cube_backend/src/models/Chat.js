import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true,
    unique: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: String,
    default: '',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  }],
  aliases: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 40,
      required: true,
    },
  }],
  clearedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clearedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  productLifecycleStatus: {
    type: String,
    enum: ['ACTIVE', 'PRODUCT_SOLD', 'PRODUCT_REMOVED'],
    default: 'ACTIVE',
  },
  productLifecycleMessage: {
    type: String,
    default: '',
  },
  deleteAfter: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
