import express from 'express';
import { getPortfolios, getPortfolioById, createPortfolio, updatePortfolio, deletePortfolio, getOwnerPortfolio } from '../controllers/portfolioController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/owner', getOwnerPortfolio);

router.route('/')
    .get(getPortfolios)
    .post(protect, admin, createPortfolio);

router.route('/:id')
    .get(getPortfolioById)
    .put(protect, admin, updatePortfolio)
    .delete(protect, admin, deletePortfolio);

export default router;
