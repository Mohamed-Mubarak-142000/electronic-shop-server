import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';

// @desc    Get message history for a room (user specific)
// @route   GET /api/chat/messages/:id
// @access  Private (User or Admin)
const getMessages = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Check if the requester is either the user themselves or an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        res.status(403);
        throw new Error('Not authorized to access these messages');
    }

    const messages = await Message.find({ roomId: userId })
        .sort({ createdAt: 1 })
        .populate('from', 'name role')
        .populate('to', 'name role');

    res.json(messages);
});

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:id
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Mark messages sent TO the requester as read in this room
    await Message.updateMany(
        { roomId: userId, to: req.user._id, read: false },
        { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
});

// @desc    Get all conversations for admin
// @route   GET /api/chat/conversations
// @access  Private (Admin only)
const getAllConversations = asyncHandler(async (req, res) => {
    // Only admins can access this
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to access conversations');
    }

    // Get all unique users who have sent messages
    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [
                    { to: req.user._id },
                    { from: req.user._id }
                ]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$from', req.user._id] },
                        '$to',
                        '$from'
                    ]
                },
                lastMessage: { $first: '$text' },
                lastMessageTime: { $first: '$createdAt' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$to', req.user._id] }, { $eq: ['$read', false] }] },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $sort: { lastMessageTime: -1 }
        }
    ]);

    // Populate user details
    const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
            const user = await req.user.constructor.findById(conv._id).select('name email role');
            return {
                user,
                lastMessage: conv.lastMessage,
                lastMessageTime: conv.lastMessageTime,
                unreadCount: conv.unreadCount
            };
        })
    );

    res.json(populatedConversations.filter(conv => conv.user !== null));
});

// @desc    Get unread message count for admin
// @route   GET /api/chat/unread
// @access  Private (Admin only)
const getUnreadCount = asyncHandler(async (req, res) => {
    // Only admins can access this
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    const unreadCount = await Message.countDocuments({
        to: req.user._id,
        read: false
    });

    res.json({ unreadCount });
});

export { getMessages, markAsRead, getAllConversations, getUnreadCount };
