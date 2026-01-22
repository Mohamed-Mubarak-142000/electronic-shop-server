import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    shipping: {
        address: { type: String, required: true },
        cost: { type: Number, default: 0 }
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual properties to match frontend expectations
orderSchema.virtual('orderItems').get(function() {
    return this.items.map(item => ({
        name: item.product?.name || 'Product',
        qty: item.qty,
        image: item.product?.images?.[0] || '',
        price: item.price,
        product: item.product
    }));
});

orderSchema.virtual('totalPrice').get(function() {
    return this.total || 0;
});

orderSchema.virtual('shippingPrice').get(function() {
    return this.shipping?.cost || 0;
});

orderSchema.virtual('itemsPrice').get(function() {
    const items = this.items || [];
    return items.reduce((acc, item) => acc + (item.price * item.qty), 0);
});

orderSchema.virtual('taxPrice').get(function() {
    const itemsTotal = this.items?.reduce((acc, item) => acc + (item.price * item.qty), 0) || 0;
    const shippingCost = this.shipping?.cost || 0;
    return this.total - itemsTotal - shippingCost;
});

orderSchema.virtual('shippingAddress').get(function() {
    return {
        address: this.shipping?.address || '',
        city: '',
        postalCode: '',
        country: ''
    };
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
