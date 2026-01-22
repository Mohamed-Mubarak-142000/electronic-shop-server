import mongoose from 'mongoose';

const discountScheduleSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    originalPriceSnapshot: { type: Number }, // To verify integrity if needed
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure we don't have overlapping active/pending schedules for the same product
// This is a partial index to ensure uniqueness only for meaningful statuses
discountScheduleSchema.index(
    { product: 1, status: 1 }, 
    { 
        unique: true, 
        partialFilterExpression: { status: { $in: ['pending', 'active'] } }
    }
);

const DiscountSchedule = mongoose.model('DiscountSchedule', discountScheduleSchema);
export default DiscountSchedule;
