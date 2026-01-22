import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        required: true,
        enum: ['order_placed', 'order_paid', 'order_delivered', 'message', 'low_stock', 'new_user', 'promotional']
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    meta: { type: Object }, // Extra data like orderId, productId, messageId
    actionUrl: { type: String }, // URL to navigate when notification is clicked
    read: { type: Boolean, default: false },
    readAt: { type: Date }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

