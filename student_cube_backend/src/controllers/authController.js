import User from '../models/User.js';
import jwt from 'jsonwebtoken'; 
import { VALID_COLLEGE_FILTERS } from '../utils/colleges.js';
import { hasConsumedPromoBenefit } from '../utils/promoUsage.js';

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
