import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    description: { type: String, required: true },
    descriptionAr: { type: String, required: true },
    images: [{ type: String }],
    projectUrl: { type: String },
    client: { type: String },
    clientAr: { type: String },
    completedAt: { type: Date },
    isPublished: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
