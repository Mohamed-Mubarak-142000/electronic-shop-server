import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getConfigs, updateConfigs } from '../controllers/configController.js';

const router = express.Router();

router.get('/', getConfigs); // Public read? Or protect? User says accessible globally. Let's make it public for now or assume authenticated users.
// Actually, payment info is sensitive? Maybe. But they are display numbers.
// "accessible editable from Settings screen" -> admin
// "accessible globally across the app" -> public for reading

router.post('/', protect, admin, updateConfigs); // Using POST to update multiple keys

export default router;
