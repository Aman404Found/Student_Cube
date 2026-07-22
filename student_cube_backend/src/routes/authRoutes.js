import express from 'express';
import { googleAuth, completeGoogleSignup, getMe, signup, login, verifyOtp, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authServiceLimiter, loginLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.get('/me', protect, authServiceLimiter, getMe);
router.post('/google', authServiceLimiter, googleAuth);
router.post('/complete-google-signup', authServiceLimiter, completeGoogleSignup);

// Standard Auth Routes
router.post('/signup', authServiceLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', authServiceLimiter, verifyOtp);
router.post('/forgot-password', authServiceLimiter, forgotPassword);
router.post('/reset-password', authServiceLimiter, resetPassword);

export default router;
