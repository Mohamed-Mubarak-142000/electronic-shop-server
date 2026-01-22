import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
