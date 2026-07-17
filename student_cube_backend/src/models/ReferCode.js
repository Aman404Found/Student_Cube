import mongoose from 'mongoose';

const referredUserSchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  referredAt: { type: Date, default: Date.now },
  
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Kis product ke liye code use hua
  status: { 
    type: String, 
    enum: ['used', 'successful', 'rejected'], 
    default: 'used' 
  } 
}, { _id: false });

const referCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  referredUsers: {
    type: [referredUserSchema],
    default: [],
  },
}, { timestamps: true });

referCodeSchema.index({ 'referredUsers.uid': 1 });

referCodeSchema.index({ 'referredUsers.productId': 1, 'referredUsers.status': 1 });

export default mongoose.model('ReferCode', referCodeSchema);
