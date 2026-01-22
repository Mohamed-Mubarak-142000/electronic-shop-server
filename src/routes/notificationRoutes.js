import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.route('/')
    .get(protect, getNotifications);

router.route('/unread-count')
    .get(protect, getUnreadCount);

router.route('/read-all')
    .put(protect, markAllAsRead);

router.route('/read')
    .delete(protect, deleteAllRead);

router.route('/:id/read')
    .put(protect, markAsRead);

router.route('/:id')
    .delete(protect, deleteNotification);

export default router;
