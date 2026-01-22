import DiscountSchedule from '../models/DiscountSchedule.js';
import Product from '../models/Product.js';

export const getSchedules = async (req, res) => {
    try {
        const schedules = await DiscountSchedule.find({})
            .populate('product', 'name price')
            .sort('-createdAt');
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createSchedule = async (req, res) => {
    try {
        const { productId, type, value, startTime, endTime } = req.body;
        
        // Validation
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        if (new Date(endTime) <= new Date()) {
            return res.status(400).json({ message: 'End time must be in the future' });
        }

        // Check for overlaps
        const existing = await DiscountSchedule.findOne({
            product: productId,
            status: { $in: ['pending', 'active'] },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { startTime: { $lte: startTime }, endTime: { $gte: endTime } } // Enveloping
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'An active or pending schedule already exists for this product in the selected time range.' });
        }

        const product = await Product.findById(productId);
        if(!product) return res.status(404).json({ message: 'Product not found' });

        const schedule = await DiscountSchedule.create({
            product: productId,
            type,
            value,
            startTime,
            endTime,
            status: 'pending',
            originalPriceSnapshot: product.price,
            createdBy: req.user._id
        });

        res.status(201).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelSchedule = async (req, res) => {
    try {
        const schedule = await DiscountSchedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        if (schedule.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel a completed schedule' });
        }

        if (schedule.status === 'active') {
            // Revert product immediately
            const product = await Product.findById(schedule.product);
            if (product) {
                product.salePrice = 0;
                product.isDiscountActive = false;
                await product.save();
            }
        }

        schedule.status = 'cancelled';
        await schedule.save();

        res.json({ message: 'Schedule cancelled and product reverted if necessary.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
