import mongoose from 'mongoose';
import { COLLEGE_STORAGE_OPTIONS } from '../utils/colleges.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  
  password: { 
    type: String,
    required: function() { return !this.googleId; } 
  }, 
  
  googleId: { type: String, unique: true, sparse: true }, 
  profilePic: { type: String },
  
  username: { type: String, unique: true, sparse: true, maxLength: 10 },
  collegeName: { type: String, enum: COLLEGE_STORAGE_OPTIONS, trim: true }, 
  role: { type: String, enum: ['user', 'ambassador', 'admin'], default: 'user' },
  
  isEmailVerified: { type: Boolean, default: false }, 
  
  otp: { type: String },
  otpExpires: { type: Date },

  promoCode: { type: String, unique: true, sparse: true }, 
  referCodeUsed: {
    code: { type: String },
    referCode: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferCode' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
  },
  walletBalance: { type: Number, default: 0 },
  payoutHistory: {
    type: [{
      amount: { type: Number, required: true },
      paidAt: { type: Date, default: Date.now },
      transactionId: { type: String, required: true, trim: true },
      note: { type: String, trim: true },
    }],
    default: [],
  },

  escrowStrikes: {
    type: Number,
    default: 0
  },
  
  isSuspended: {
    type: Boolean,
    default: false
  },

  resetPasswordOtp: { type: String },
  otpExpiryTime: { type: Date },
  
}, { timestamps: true });

export default mongoose.model('User', userSchema);
