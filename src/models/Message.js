import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usually Admin <-> User
    roomId: { type: String, required: true }, // e.g., user_ID or order_ID
    text: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
