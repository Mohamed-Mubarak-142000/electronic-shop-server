import express from 'express';
import { getMessages, markAsRead, getAllConversations, getUnreadCount } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/conversations').get(getAllConversations);
router.route('/unread').get(getUnreadCount);
router.route('/messages/:id').get(getMessages);
router.route('/read/:id').put(markAsRead);

export default router;
