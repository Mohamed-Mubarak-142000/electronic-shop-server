import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            verified: user.verified,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            location: user.location,
            jobTitle: user.jobTitle,
            jobTitleAr: user.jobTitleAr,
            bio: user.bio,
            bioAr: user.bioAr,
            experience: user.experience,
            isHiring: user.isHiring,
            skills: user.skills
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.address = req.body.address || user.address;
        user.location = req.body.location || user.location;
        user.jobTitle = req.body.jobTitle !== undefined ? req.body.jobTitle : user.jobTitle;
        user.jobTitleAr = req.body.jobTitleAr !== undefined ? req.body.jobTitleAr : user.jobTitleAr;
        user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
        user.bioAr = req.body.bioAr !== undefined ? req.body.bioAr : user.bioAr;
        user.experience = req.body.experience !== undefined ? req.body.experience : user.experience;
        user.isHiring = req.body.isHiring !== undefined ? req.body.isHiring : user.isHiring;
        user.skills = req.body.skills !== undefined ? req.body.skills : user.skills;
        
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            phone: updatedUser.phone,
            address: updatedUser.address,
            location: updatedUser.location,
            jobTitle: updatedUser.jobTitle,
            jobTitleAr: updatedUser.jobTitleAr,
            bio: updatedUser.bio,
            bioAr: updatedUser.bioAr,
            experience: updatedUser.experience,
            isHiring: updatedUser.isHiring,
            skills: updatedUser.skills,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        // Search by name or email
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (req.query.role) {
            filter.role = req.query.role;
        }

        // Filter by active status
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        // Filter by verified status
        if (req.query.verified !== undefined) {
            filter.verified = req.query.verified === 'true';
        }

        // Sorting
        let sort = '-createdAt'; // Default newest first
        if (req.query.sort) {
            sort = req.query.sort;
        }

        const count = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password')
            .sort(sort)
            .limit(limit)
            .skip(skip);

        res.json({ users, page, pages: Math.ceil(count / limit), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};;

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.isActive = req.body.isActive ?? user.isActive;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get showroom/admin public info
// @route   GET /api/users/showroom
// @access  Public
export const getShowroomInfo = async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' }).select('name email phone address location');
        if (admin) {
            res.json(admin);
        } else {
            res.status(404).json({ message: 'Showroom info not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
