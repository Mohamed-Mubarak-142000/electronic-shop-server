import Configuration from '../models/Configuration.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js'; // Ensure it's imported for population
import Brand from '../models/Brand.js';

export const getSliderProducts = async (req, res) => {
    try {
        const sliderKeys = ['heroSliderProduct1', 'heroSliderProduct2', 'heroSliderProduct3', 'heroSliderProduct4'];
        const configs = await Configuration.find({ key: { $in: sliderKeys } });

        const productIds = configs
            .map(c => c.value)
            .filter(id => id && id.length > 0 && id !== '');

        if (productIds.length === 0) {
            return res.json([]);
        }

        const products = await Product.find({ _id: { $in: productIds } })
            .populate('category')
            .populate('brand');

        // Maintain the order of IDs if possible, or just return them
        const orderedProducts = productIds.map(id => products.find(p => p._id.toString() === id.toString())).filter(Boolean);

        res.json(orderedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Flag to track if configs have been initialized
let configsInitialized = false;

export const getConfigs = async (req, res) => {
    try {
        // Lazy initialization - only seed configs on first GET request
        if (!configsInitialized) {
            await seedConfigs();
            configsInitialized = true;
        }

        const configs = await Configuration.find({});
        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(configMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateConfigs = async (req, res) => {
    try {
        const updates = req.body; // Expects { key: value, key2: value2 }
        const operations = Object.entries(updates).map(([key, value]) => ({
            updateOne: {
                filter: { key },
                update: { $set: { value } },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Configuration.bulkWrite(operations);
        }

        const configs = await Configuration.find({});
        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(configMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Seeds default configurations (only if they don't exist)
 * Now called lazily on first config request instead of on every startup
 */
export const seedConfigs = async () => {
    try {
        const defaults = [
            { key: 'language', value: 'en', group: 'general', description: 'Default Language' },
            { key: 'currency', value: 'USD', group: 'payment', description: 'Default Currency' },
            { key: 'vodafoneCashNumber', value: '01050867135', group: 'payment', description: 'Vodafone Cash Number' },
            { key: 'instapayNumber', value: '01050867135', group: 'payment', description: 'Instapay Number' },
            { key: 'creditCardNumber', value: '4745010135393008', group: 'payment', description: 'Credit Card Number' },
            { key: 'taxiAmount', value: 15, group: 'payment', description: 'Taxi Amount' },
            { key: 'minProductImages', value: 2, group: 'product', description: 'Minimum Product Images' },
            { key: 'maxProductImages', value: 4, group: 'product', description: 'Maximum Product Images' },
            { key: 'emailHost', value: 'smtp.gmail.com', group: 'email', description: 'Email SMTP Host' },
            { key: 'emailPort', value: 587, group: 'email', description: 'Email SMTP Port' },
            { key: 'emailUser', value: 'mohamedmubarak142000m@gmail.com', group: 'email', description: 'Email User' },
            { key: 'emailPassword', value: 'fqdd uhpq tszv dznb', group: 'email', description: 'Email Password' },
            { key: 'fromName', value: 'Electro Shop', group: 'email', description: 'Sender Name' },
            { key: 'fromEmail', value: 'noreply@electroshop.com', group: 'email', description: 'Sender Email' },
            // Home Page Configurations
            { key: 'showPortfolioPage', value: true, group: 'home', description: 'Show Portfolio in Navbar' },
            { key: 'showCategoriesSection', value: true, group: 'home', description: 'Show Categories Section' },
            { key: 'showBestSellersSection', value: true, group: 'home', description: 'Show Best Sellers Section' },
            { key: 'showPartnerSection', value: true, group: 'home', description: 'Show Partner/B2B Section' },
            { key: 'showNewArrivalsSection', value: true, group: 'home', description: 'Show New Arrivals Section' },
            { key: 'showTestimonialsSection', value: true, group: 'home', description: 'Show Testimonials Section' },
            { key: 'showShowroomMapSection', value: true, group: 'home', description: 'Show Showroom Map Section' },
            // Home Page Dynamic Content
            { key: 'heroTitle1', value: 'Power Your', group: 'home', description: 'Hero Section Title 1' },
            { key: 'heroTitle2', value: 'World', group: 'home', description: 'Hero Section Title 2' },
            { key: 'heroSubtitle', value: 'Discover premium electrical components for your home and business. Innovation meets reliability.', group: 'home', description: 'Hero Section Subtitle' },
            { key: 'b2bBadge', value: 'FOR PROFESSIONALS', group: 'home', description: 'B2B Section Badge' },
            { key: 'b2bTitle1', value: 'Are You a', group: 'home', description: 'B2B Section Title 1' },
            { key: 'b2bTitle2', value: 'Professional?', group: 'home', description: 'B2B Section Title 2' },
            { key: 'b2bDescription', value: 'Join our business program for exclusive pricing, bulk discounts, and dedicated support for your projects.', group: 'home', description: 'B2B Section Description' },
            { key: 'testimonialsTitle', value: 'What Our Clients Say', group: 'home', description: 'Testimonials Section Title' },
            { key: 'testimonialsSubtitle', value: 'We take pride in serving our clients and providing them with the best electrical solutions.', group: 'home', description: 'Testimonials Section Subtitle' },
            { key: 'heroType', value: 'hero', group: 'home', description: 'Hero Display Type (hero or slider)' },
            { key: 'heroSliderProduct1', value: '', group: 'home', description: 'Hero Slider Product 1 ID' },
            { key: 'heroSliderProduct2', value: '', group: 'home', description: 'Hero Slider Product 2 ID' },
            { key: 'heroSliderProduct3', value: '', group: 'home', description: 'Hero Slider Product 3 ID' },
            { key: 'heroSliderProduct4', value: '', group: 'home', description: 'Hero Slider Product 4 ID' }
        ];

        // Use bulkWrite for better performance in serverless
        const operations = defaults.map(config => ({
            updateOne: {
                filter: { key: config.key },
                update: { $setOnInsert: config },
                upsert: true
            }
        }));

        await Configuration.bulkWrite(operations);
        console.log('Configs initialized lazily');
    } catch (error) {
        console.error('Config seed error:', error);
        throw error;
    }
};
