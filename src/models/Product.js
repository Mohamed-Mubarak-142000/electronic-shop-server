import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, unique: true },
    description: { type: String, required: true },
    descriptionAr: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' }, // Adjust default currency if needed
    stock: { type: Number, required: true, default: 0 },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    images: [{ type: String }],
    attributes: {
        // Flexible attributes for different product types
        type: Map,
        of: String
    },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    salePrice: { type: Number, default: 0 },
    isDiscountActive: { type: Boolean, default: false }
}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
