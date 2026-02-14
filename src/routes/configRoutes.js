import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getConfigs, updateConfigs, getSliderProducts } from '../controllers/configController.js';

const router = express.Router();

router.get('/slider-products', getSliderProducts);
router.get('/', getConfigs);
// Actually, payment info is sensitive? Maybe. But they are display numbers.
// "accessible editable from Settings screen" -> admin
// "accessible globally across the app" -> public for reading

router.post('/', protect, admin, updateConfigs); // Using POST to update multiple keys

export default router;
