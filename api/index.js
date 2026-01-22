import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from '../src/config/db.js';

// Routes
import authRoutes from '../src/routes/authRoutes.js';
import productRoutes from '../src/routes/productRoutes.js';
import orderRoutes from '../src/routes/orderRoutes.js';
import categoryRoutes from '../src/routes/categoryRoutes.js';
import brandRoutes from '../src/routes/brandRoutes.js';
import userRoutes from '../src/routes/userRoutes.js';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import chatRoutes from '../src/routes/chatRoutes.js';
import portfolioRoutes from '../src/routes/portfolioRoutes.js';
import jobRoutes from '../src/routes/jobRoutes.js';
import scheduleRoutes from '../src/routes/scheduleRoutes.js';
import configRoutes from '../src/routes/configRoutes.js';
import uploadRoutes from '../src/routes/uploadRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/config', configRoutes);
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Electro Shop API is running...',
        timestamp: new Date().toISOString()
    });
});

// MongoDB health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Custom Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[Error] ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Serverless handler - connects to DB before handling request
export default async function handler(req, res) {
    try {
        // Ensure MongoDB connection before processing request
        await connectDB();
        
        // Pass request to Express app
        return app(req, res);
    } catch (error) {
        console.error('Database connection failed:', error);
        return res.status(503).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
}
