import mongoose from 'mongoose';
import { COLLEGE_STORAGE_OPTIONS } from '../utils/colleges.js';

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  description: { type: String, required: true },
  college: { type: String, enum: COLLEGE_STORAGE_OPTIONS, required: true },
  
  // Media
  images: [{
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  }],
  videoProof: { type: String, },
  
  // Extra Info
  views: { type: Number, default: 0 },
  
  viewedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  appliedPromoCode: { type: String },
  isPromoRewarded: { type: Boolean, default: false },
  rejectionMessage: { type: String, trim: true },

  status: {
    type: String,
    enum: ['pending', 'AVAILABLE', 'RESERVED', 'SOLD_OUT', 'rejected'],
    default: 'pending'
  },

  purchasedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },

  paymentDeadline: {
    type: Date,
    default: null
  },

  soldAt: {
    type: Date,
    default: null
  },

  bannedBuyers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer' 
  }]
}, { timestamps: true });

// Performance Indexes
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ college: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ seller: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
