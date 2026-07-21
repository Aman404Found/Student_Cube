import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  kind: {
    type: String,
    enum: ['OFFER', 'COUNTER_OFFER', 'SYSTEM', 'PREDEFINED', 'CUSTOM', 'PAYMENT'],
    default: 'CUSTOM'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Performance Indexes
messageSchema.index({ chat: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
