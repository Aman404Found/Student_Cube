import express from 'express';
import { getMyChats, getChatHistory, getUnreadChatSummary, markChatRead } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { chatServiceLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();
router.get('/', protect, chatServiceLimiter, getMyChats);
router.get('/unread', protect, chatServiceLimiter, getUnreadChatSummary);
router.put('/:offerId/read', protect, chatServiceLimiter, markChatRead);
router.get('/:offerId', protect, chatServiceLimiter, getChatHistory);

export default router;
