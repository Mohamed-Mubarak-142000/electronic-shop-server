import express from 'express';
import { loginUser, registerUser, registerBusiness, verifyOTP, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/register-business', registerBusiness);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;
