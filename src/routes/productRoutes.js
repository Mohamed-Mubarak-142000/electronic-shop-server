import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    updateProduct,
    getRecommendedProducts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/recommended', protect, getRecommendedProducts);
router.route('/:id').get(getProductById).delete(protect, admin, deleteProduct).put(protect, admin, updateProduct);

export default router;
