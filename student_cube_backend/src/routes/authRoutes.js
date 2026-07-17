import express from 'express';
import { googleAuth, completeGoogleSignup, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authServiceLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.get('/me', protect, authServiceLimiter, getMe);
router.post('/google', authServiceLimiter, googleAuth);
router.post('/complete-google-signup', authServiceLimiter, completeGoogleSignup);

export default router;
