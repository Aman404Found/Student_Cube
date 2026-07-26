import mongoose from 'mongoose';
import { COLLEGE_STORAGE_OPTIONS } from '../utils/colleges.js';

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
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
// Cover the default product listing query (available/sold_out + sort by newest)
productSchema.index({ status: 1, createdAt: -1 });
// Cover status + soldAt filter (the $or branch for recently sold items)
productSchema.index({ status: 1, soldAt: 1 });
// Cover category + status filter with sort
productSchema.index({ category: 1, status: 1, createdAt: -1 });
// Cover college + status filter with sort
productSchema.index({ college: 1, status: 1, createdAt: -1 });
// Cover price + status filter with sort
productSchema.index({ price: 1, status: 1, createdAt: -1 });
// Cover condition + status filter with sort
productSchema.index({ condition: 1, status: 1, createdAt: -1 });
// Cover seller queries
productSchema.index({ seller: 1, createdAt: -1 });
// Text index for product search (title + category) — avoids $regex full collection scans
productSchema.index({ title: 'text', category: 'text' }, { default_language: 'none' });

export default mongoose.model('Product', productSchema);
