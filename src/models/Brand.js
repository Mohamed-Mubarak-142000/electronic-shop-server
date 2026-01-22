import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
