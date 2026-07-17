import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  offerPrice: {
    type: Number,
    required: true
  },

  // Seller Counter Demand
  counterPrice: {
    type: Number,
    default: null
  },

  // New negotiation status field to track the state of the offer
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'revoked', 'countered', 'on_hold', 'failed'],
    default: 'pending'
  },

  // Inside your Offer Schema:
transactionId: {
  type: String,
  trim: true,
  default: null
},
paymentStatus: {
  type: String,
  enum: ['NONE', 'PENDING_VERIFICATION', 'PAID', 'REJECTED'],
  default: 'NONE'
},
paidAt: {
  type: Date,
  default: null
}

}, { timestamps: true });

export default mongoose.model('Offer', offerSchema);
