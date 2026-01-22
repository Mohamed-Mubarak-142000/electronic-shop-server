import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['discount', 'notification', 'other'], default: 'notification' },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: { type: String, enum: ['Product', 'Category'] },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Active', 'Completed', 'Failed'], default: 'Pending' },
    data: {
        discountPercentage: Number,
        message: String,
        messageAr: String
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;
