import Configuration from '../models/Configuration.js';

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
            { key: 'maxProductImages', value: 4, group: 'product', description: 'Maximum Product Images' }
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
