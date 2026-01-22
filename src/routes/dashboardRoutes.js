import express from 'express';
import {
    getDashboardStats,
    getProductStats,
    getCategoryStats,
    getBrandStats
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/products/stats', protect, admin, getProductStats);
router.get('/categories/stats', protect, admin, getCategoryStats);
router.get('/brands/stats', protect, admin, getBrandStats);

export default router;
