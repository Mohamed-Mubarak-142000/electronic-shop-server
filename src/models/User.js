import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'business'], default: 'user' },
    isActive: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    avatar: { type: String },
    phone: { type: String },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zip: String
    },
    location: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    otp: String,
    otpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    bio: String,
    bioAr: String,
    jobTitle: String,
    jobTitleAr: String,
    companyName: String,
    skills: [{
        name: String,
        nameAr: String,
        level: { type: String, enum: ['Beginner', 'Advanced', 'Expert', 'Certified'] },
        icon: String
    }],
    experience: Number,
    isHiring: { type: Boolean, default: false },
    // Online status and last seen
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
