import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String },
    group: { type: String, enum: ['general', 'payment', 'contact'], default: 'general' }
}, { timestamps: true });

const Configuration = mongoose.model('Configuration', configSchema);
export default Configuration;
