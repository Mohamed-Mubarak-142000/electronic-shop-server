import express from 'express';
import { getJobs, createJob, updateJob, deleteJob } from '../controllers/jobController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getJobs)
    .post(protect, admin, createJob);

router.route('/:id')
    .put(protect, admin, updateJob)
    .delete(protect, admin, deleteJob);

export default router;
