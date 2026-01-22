import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { notifyOrderPlaced, notifyOrderStatusUpdate } from '../utils/notificationService.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
    const {
        items,
        shipping,
        paymentMethod,
        total,
    } = req.body;

    if (items && items.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }

            const quantity = Number(item.qty || item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                 throw new Error(`Invalid quantity for product: ${product.name}`);
            }

            if (product.stock < quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            // Update stock directly to avoid validation errors on other fields
            await Product.updateOne(
                { _id: product._id },
                { $inc: { stock: -quantity } }
            ).session(session);

            orderItems.push({
                product: item.product,
                qty: quantity,
                price: item.price
            });
        }

        const order = new Order({
            items: orderItems,
            user: req.user._id,
            shipping,
            paymentMethod,
            paymentResult: req.body.paymentResult || (req.body.paymentDetails ? {
                id: req.body.paymentDetails.transactionId || req.body.paymentDetails.referenceNumber,
                status: 'Pending',
                update_time: String(Date.now()),
                email_address: req.user.email
            } : undefined),
            total
        });

        const createdOrder = await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Notify Admin via Socket
        if (req.io) {
            notifyOrderPlaced(req.io, createdOrder, req.user);
        }

        // Send Email (Async)
        try {
            if (process.env.EMAIL_USER) {
                await sendEmail({
                    email: req.user.email,
                    subject: 'Order Confirmation',
                    message: `Thank you for your order. Order ID: ${createdOrder._id}`
                });
            }
        } catch (error) {
            console.error('Email send failed:', error);
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400);
        throw error;
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'name images');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address,
            };

            const updatedOrder = await order.save();

            if (req.io) {
                notifyOrderStatusUpdate(req.io, updatedOrder, 'paid');
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.status = 'Delivered';

            const updatedOrder = await order.save();

            if (req.io) {
                notifyOrderStatusUpdate(req.io, updatedOrder, 'delivered');
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;

        // Update related fields based on status
        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();

        if (req.io) {
            notifyOrderStatusUpdate(req.io, updatedOrder, status.toLowerCase());
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 12;
        const page = Number(req.query.page) || 1;

        // Build filter object
        const filter = {};

        // Search by order ID, user name, or email
        if (req.query.search) {
            filter.$or = [
                { _id: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by payment status
        if (req.query.isPaid !== undefined) {
            filter.isPaid = req.query.isPaid === 'true';
        }

        // Filter by delivery status
        if (req.query.isDelivered !== undefined) {
            filter.isDelivered = req.query.isDelivered === 'true';
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                filter.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.createdAt.$lte = new Date(req.query.endDate);
            }
        }

        // Sorting
        let sort = '-createdAt'; // Default newest first
        if (req.query.sort) {
            sort = req.query.sort;
        }

        const count = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .sort(sort)
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate('user', 'id name email')
            .populate('items.product', 'name images');

        res.json({ orders, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
