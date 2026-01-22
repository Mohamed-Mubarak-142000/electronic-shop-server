import mongoose from 'mongoose';

/**
 * Global cache to prevent duplicate connections in serverless environment
 * Vercel's serverless functions may reuse execution contexts, so we cache
 * the connection to avoid reconnecting on every request
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Serverless-optimized MongoDB connection with caching
 * Returns existing connection if available, otherwise creates new one
 */
const connectDB = async () => {
    // Return cached connection if already established
    if (cached.conn) {
        return cached.conn;
    }

    // Return ongoing connection promise if one exists
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering in serverless
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        // Create and cache the connection promise
        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null; // Reset on failure
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }

    return cached.conn;
};

export default connectDB;
