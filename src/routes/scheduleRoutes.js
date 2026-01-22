import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getSchedules, createSchedule, cancelSchedule } from '../controllers/scheduleController.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.route('/')
    .get(getSchedules)
    .post(createSchedule);

router.route('/:id/cancel')
    .put(cancelSchedule);

export default router;
