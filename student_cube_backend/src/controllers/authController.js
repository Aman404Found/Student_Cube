import User from '../models/User.js';
import jwt from 'jsonwebtoken'; 
import bcrypt from 'bcryptjs';
import { VALID_COLLEGE_FILTERS } from '../utils/colleges.js';
import { hasConsumedPromoBenefit } from '../utils/promoUsage.js';
import { sendOTP } from '../utils/emailService.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const formatAuthUser = async (user) => {
  const userData = user.toObject ? user.toObject() : user;
  const hasUsedReferCode = await hasConsumedPromoBenefit(userData._id);

  return {
    ...userData,
    college: userData.collegeName,
    hasUsedReferCode,
  };
};

export const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, profilePic } = req.body;

    let user = await User.findOne({ email });

    if (user && user.isSuspended) {
      return res.status(403).json({ success: false, message: "Your account has been suspended due to policy violations." });
    }

    if (user) {
      if (user.collegeName) {
        const token = generateToken(user._id);
        
        return res.status(200).json({
          success: true,
          isNewUser: false,
          message: "Login successful",
          token, 
          user: await formatAuthUser(user),
        });
      } else {
        return res.status(200).json({
          success: true,
          isNewUser: true,
          message: "College name required",
          googleData: { email, name, googleId, profilePic }
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        message: "New user detected, college name required",
        googleData: { email, name, googleId, profilePic }
      });
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ success: false, message: "Server error during Google Auth" });
  }
};

export const completeGoogleSignup = async (req, res) => {
  try {
    const { email, name, googleId, profilePic, collegeName } = req.body;

    if (!collegeName) {
      return res.status(400).json({ success: false, message: "College name is required" });
    }

    const selectedCollege = String(collegeName).trim();
    if (!VALID_COLLEGE_FILTERS.has(selectedCollege)) {
      return res.status(400).json({ success: false, message: "Please select a college from the list" });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.collegeName = selectedCollege;
      user.googleId = googleId;
      if (profilePic) user.profilePic = profilePic;
      user.isEmailVerified = true;
      
      await user.save(); 
    } else {
      user = await User.create({
        email,
        name,
        googleId,
        profilePic,
        collegeName: selectedCollege,
        isEmailVerified: true,
      });
    }

    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: "Signup completed successfully",
      token,
      user: await formatAuthUser(user),
    });
  } catch (error) {
    console.error("Complete Signup Error:", error);
    res.status(500).json({ success: false, message: "Server error during signup completion" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: await formatAuthUser(req.user),
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching user" });
  }
};

// ==========================================
// STANDARD AUTHENTICATION (EMAIL / PASSWORD)
// ==========================================

export const signup = async (req, res) => {
  try {
    const { email, password, name, collegeName } = req.body;

    if (!email || !password || !name || !collegeName) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    const selectedCollege = String(collegeName).trim();
    if (!VALID_COLLEGE_FILTERS.has(selectedCollege)) {
      return res.status(400).json({ success: false, message: "Please select a college from the list." });
    }

    let user = await User.findOne({ email });

    if (user && user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user) {
      // Re-registering unverified user
      user.password = hashedPassword;
      user.name = name;
      user.collegeName = selectedCollege;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        email,
        password: hashedPassword,
        name,
        collegeName: selectedCollege,
        otp,
        otpExpires,
        isEmailVerified: false,
      });
    }

    await sendOTP(email, otp, "Registration");

    res.status(201).json({
      success: true,
      message: "Signup successful. Please verify your email with the OTP sent.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isEmailVerified && !user.otp) {
      return res.status(400).json({ success: false, message: "User is already verified." });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token,
      user: await formatAuthUser(user),
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "Your account has been suspended due to policy violations." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ success: false, message: "Please verify your email first.", needsVerification: true });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: await formatAuthUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // AUTH-08: Do not leak whether an email exists. Always return a generic success message.
    if (!user || !user.password) {
      return res.status(200).json({ success: true, message: "If an account with that email exists, an OTP has been sent." });
    }

    const otp = generateOTP();
    user.resetPasswordOtp = otp;
    user.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOTP(email, otp, "Password Reset");

    res.status(200).json({ success: true, message: "If an account with that email exists, an OTP has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server error during forgot password" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const user = await User.findOne({ email });

    if (!user || user.resetPasswordOtp !== otp || user.otpExpiryTime < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.otpExpiryTime = undefined;
    
    // Automatically verify email if they reset password successfully via OTP
    user.isEmailVerified = true; 
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
};

