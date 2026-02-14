import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is inactive' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        const user = await User.create({
            name,
            email,
            password,
            otp: hashedOtp,
            otpExpire,
            verified: false
        });

        if (user) {
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your account',
                    message: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
                });

                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    message: 'Registration successful. Please check your email for OTP.',
                });
            } catch (err) {
                console.error('Email send failed:', err);
                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    message: 'User created but failed to send OTP email. Please use forgot password.',
                });
            }
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new business user
// @route   POST /api/auth/register-business
// @access  Public
export const registerBusiness = async (req, res) => {
    const { name, email, password, phone, companyName } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'business',
            otp: hashedOtp,
            otpExpire,
            verified: false
        });

        if (user) {
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your Business account',
                    message: `Welcome to ElectroShop Business! Your OTP is: ${otp}. It will expire in 10 minutes.`,
                });

                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    message: 'Registration successful. Please check your email for OTP.',
                });
            } catch (err) {
                console.error('Email send failed:', err);
                res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    message: 'Business account created but failed to send OTP email.',
                });
            }
        } else {
            res.status(400).json({ message: 'Invalid business data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (user && isMatch) {
            user.verified = true;
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                message: 'Account verified successfully'
            });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.otp = hashedOtp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpVerified = false;
        user.otpRetryCount = 0;

        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Code',
                message: `Your password reset code is: ${otp}. This code will expire in 10 minutes. If you did not request this, please ignore this email.`,
            });

            res.json({ message: 'OTP sent to email' });
        } catch (err) {
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp || !user.otpExpire || user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
        }

        if (user.otpRetryCount >= 5) {
            return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            user.otpRetryCount += 1;
            await user.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.otpVerified = true;
        await user.save();

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpVerified) {
            return res.status(400).json({ message: 'OTP not verified' });
        }

        if (user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP session expired. Please start over.' });
        }

        user.password = password;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpVerified = false;
        user.otpRetryCount = 0;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
