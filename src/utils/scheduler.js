import cron from 'node-cron';
import Job from '../models/Job.js';
import Product from '../models/Product.js';
import DiscountSchedule from '../models/DiscountSchedule.js';

export const initScheduler = (io) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();

        // ------------------------------------------
        // 1. Existing Generic Jobs (Notifications etc)
        // ------------------------------------------
        try {
            const pendingJobs = await Job.find({
                status: 'Pending',
                scheduledAt: { $lte: now }
            });

            for (const job of pendingJobs) {
                console.log(`Executing job: ${job.name} (${job._id})`);
                job.status = 'Active';
                await job.save();

                try {
                    if (job.type === 'notification') {
                        io.emit('job_notification', {
                            message: job.data.message,
                            messageAr: job.data.messageAr
                        });
                    }
                    // 'discount' type in Job model is deprecated in favor of DiscountSchedule,
                    // but kept for backward compatibility if needed.
                    
                    job.status = 'Completed';
                } catch (err) {
                    console.error(`Error executing job ${job._id}:`, err);
                    job.status = 'Failed';
                }
                await job.save();
            }
        } catch (error) {
            console.error('Job Scheduler error:', error);
        }

        // ------------------------------------------
        // 2. New Discount Schedule Logic
        // ------------------------------------------

        // A. ACTIVATE DISCOUNTS
        try {
            const jobsToStart = await DiscountSchedule.find({
                status: 'pending',
                startTime: { $lte: now }
            }).populate('product');

            for (const schedule of jobsToStart) {
                if (!schedule.product) {
                    schedule.status = 'cancelled'; 
                    await schedule.save();
                    continue;
                }

                console.log(`Starting discount schedule for ${schedule.product.name}`);
                
                // Calculate Sale Price
                let salePrice = 0;
                if (schedule.type === 'percentage') {
                    salePrice = schedule.product.price * (1 - schedule.value / 100);
                } else {
                    salePrice = schedule.product.price - schedule.value;
                }
                
                // Ensure non-negative
                if (salePrice < 0) salePrice = 0;

                // Update Product (using findByIdAndUpdate to bypass validation of other fields like nameAr)
                const product = await Product.findByIdAndUpdate(schedule.product._id, {
                    salePrice: Math.round(salePrice),
                    isDiscountActive: true
                }, { new: true });

                // Update Schedule
                schedule.status = 'active';
                await schedule.save();

                if (product) {
                    io.emit('discount_started', {
                        productId: product._id,
                        name: product.name,
                        salePrice: product.salePrice
                    });
                }
            }
        } catch (error) {
            console.error('Discount Activation Error:', error);
        }

        // B. DEACTIVATE (EXPIRE) DISCOUNTS
        try {
            const jobsToEnd = await DiscountSchedule.find({
                status: 'active',
                endTime: { $lte: now }
            }).populate('product');

            for (const schedule of jobsToEnd) {
                console.log(`Ending discount schedule for product ID ${schedule.product._id || schedule.product}`);

                // Revert Product (using findByIdAndUpdate to bypass validation)
                const product = await Product.findByIdAndUpdate(schedule.product._id || schedule.product, {
                    salePrice: 0,
                    isDiscountActive: false
                }, { new: true });
                
                if (product) {
                    io.emit('discount_ended', {
                        productId: product._id,
                        name: product.name
                    });
                }

                schedule.status = 'completed';
                await schedule.save();
            }
        } catch (error) {
            console.error('Discount Expiration Error:', error);
        }
    });
};
