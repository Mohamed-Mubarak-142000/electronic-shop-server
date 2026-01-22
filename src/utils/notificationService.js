import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create and emit a notification
 * @param {Object} io - Socket.IO instance
 * @param {Object} data - Notification data
 * @param {String} data.recipientId - User ID of the recipient
 * @param {String} data.type - Notification type
 * @param {String} data.title - Notification title
 * @param {String} data.body - Notification body
 * @param {Object} data.meta - Additional metadata
 * @param {String} data.actionUrl - URL to navigate when clicked
 */
const createNotification = async (io, data) => {
    try {
        const notification = await Notification.create({
            recipient: data.recipientId,
            type: data.type,
            title: data.title,
            body: data.body,
            meta: data.meta || {},
            actionUrl: data.actionUrl || null
        });

        // Emit real-time notification to the recipient
        if (io) {
            io.to(data.recipientId.toString()).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Notify admin when a new order is placed
 */
export const notifyOrderPlaced = async (io, order, user) => {
    try {
        // Find all admin users
        const admins = await User.find({ role: 'admin' });

        // Create notification for each admin
        for (const admin of admins) {
            await createNotification(io, {
                recipientId: admin._id,
                type: 'order_placed',
                title: 'New Order Placed',
                body: `${user.name} placed a new order #${order._id.toString().slice(-6)} worth $${order.totalPrice}`,
                meta: { orderId: order._id, userId: user._id },
                actionUrl: `/admin/orders`
            });
        }
    } catch (error) {
        console.error('Error notifying order placed:', error);
    }
};

/**
 * Notify user when order status is updated
 */
export const notifyOrderStatusUpdate = async (io, order, status) => {
    try {
        let title = '';
        let body = '';
        let type = '';

        switch (status) {
            case 'paid':
                type = 'order_paid';
                title = 'Payment Confirmed';
                body = `Your payment for order #${order._id.toString().slice(-6)} has been confirmed.`;
                break;
            case 'delivered':
                type = 'order_delivered';
                title = 'Order Delivered';
                body = `Your order #${order._id.toString().slice(-6)} has been delivered. Enjoy your purchase!`;
                break;
            default:
                type = 'order_paid';
                title = 'Order Status Updated';
                body = `Your order #${order._id.toString().slice(-6)} status has been updated.`;
        }

        await createNotification(io, {
            recipientId: order.user,
            type,
            title,
            body,
            meta: { orderId: order._id },
            actionUrl: `/orders/${order._id}`
        });
    } catch (error) {
        console.error('Error notifying order status update:', error);
    }
};

/**
 * Notify recipient when a new message arrives
 */
export const notifyNewMessage = async (io, message, sender) => {
    try {
        await createNotification(io, {
            recipientId: message.to,
            type: 'message',
            title: 'New Message',
            body: `${sender.name} sent you a message: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`,
            meta: { messageId: message._id, senderId: sender._id },
            actionUrl: sender.role === 'admin' ? `/chat` : `/admin/messenger`
        });
    } catch (error) {
        console.error('Error notifying new message:', error);
    }
};

/**
 * Notify admin when product stock is low
 */
export const notifyLowStock = async (io, product) => {
    try {
        // Find all admin users
        const admins = await User.find({ role: 'admin' });

        // Create notification for each admin
        for (const admin of admins) {
            await createNotification(io, {
                recipientId: admin._id,
                type: 'low_stock',
                title: 'Low Stock Alert',
                body: `${product.name} is running low on stock. Only ${product.stock} units remaining.`,
                meta: { productId: product._id },
                actionUrl: `/admin/products`
            });
        }
    } catch (error) {
        console.error('Error notifying low stock:', error);
    }
};

/**
 * Notify admin when a new user registers
 */
export const notifyNewUser = async (io, user) => {
    try {
        // Find all admin users
        const admins = await User.find({ role: 'admin' });

        // Create notification for each admin
        for (const admin of admins) {
            await createNotification(io, {
                recipientId: admin._id,
                type: 'new_user',
                title: 'New User Registration',
                body: `${user.name} (${user.email}) just registered on the platform.`,
                meta: { userId: user._id },
                actionUrl: `/admin/users`
            });
        }
    } catch (error) {
        console.error('Error notifying new user:', error);
    }
};

export default {
    notifyOrderPlaced,
    notifyOrderStatusUpdate,
    notifyNewMessage,
    notifyLowStock,
    notifyNewUser
};
