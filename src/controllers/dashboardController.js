import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({});
        const totalOrders = await Order.countDocuments({});
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalCategories = await Category.countDocuments({});
        const totalBrands = await Brand.countDocuments({});
        const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

        const orders = await Order.find({});
        const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);

        // Revenue Graph Data (Monthly)
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear },
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" }, // 1-12
                    total: { $sum: "$total" }
                }
            }
        ]);

        const revenueGraphData = Array(12).fill(0);
        monthlyRevenue.forEach(item => {
            revenueGraphData[item._id - 1] = item.total;
        });

        // Recent Orders
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('items.product', 'name images');

        // Low Stock Products
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .limit(3)
            .select('name stock images price')
            .sort({ stock: 1 });

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalCategories,
            totalBrands,
            totalRevenue,
            lowStockCount,
            trends: {
                revenue: 12.5,
                orders: 5.2,
                users: 8.1
            },
            revenueGraphData,
            recentOrders,
            lowStockProducts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product specific stats
// @route   GET /api/dashboard/products/stats
// @access  Private/Admin
export const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({});
        const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

        const products = await Product.find({}, 'price stock');
        const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

        res.json({
            totalProducts,
            lowStockCount,
            totalInventoryValue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get category specific stats
// @route   GET /api/dashboard/categories/stats
// @access  Private/Admin
export const getCategoryStats = async (req, res) => {
    try {
        const totalCategories = await Category.countDocuments({});
        res.json({
            totalCategories,
            activeCategories: totalCategories,
            hiddenCategories: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get brand specific stats
// @route   GET /api/dashboard/brands/stats
// @access  Private/Admin
export const getBrandStats = async (req, res) => {
    try {
        const totalBrands = await Brand.countDocuments({});
        res.json({
            totalBrands,
            activeBrands: totalBrands,
            inactiveBrands: 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
