import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';
import Brand from './src/models/Brand.js';
import Order from './src/models/Order.js';
import connectDB from './src/config/db.js';

dotenv.config({ path: 'server/.env' });

connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await Brand.deleteMany();

        console.log('Data Destroyed!');

        // 1. Create Users
        const createdUsers = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
                isActive: true,
                verified: true
            },
            {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'password123',
                role: 'user',
                isActive: true,
                verified: true
            }
        ]);

        const adminUser = createdUsers[0]._id;

        // 2. Create Categories (5)
        const categories = await Category.insertMany([
            { name: 'Laptops', description: 'High performance laptops', slug: 'laptops' },
            { name: 'Smartphones', description: 'Latest smartphones', slug: 'smartphones' },
            { name: 'Headphones', description: 'Noise cancelling headphones', slug: 'headphones' },
            { name: 'Wearables', description: 'Smart watches and bands', slug: 'wearables' },
            { name: 'Cameras', description: 'DSLR and Mirrorless cameras', slug: 'cameras' }
        ]);

        // 3. Create Brands (5)
        const brands = await Brand.insertMany([
            { name: 'Apple', description: 'Think Different', slug: 'apple' },
            { name: 'Samsung', description: 'Do what you can\'t', slug: 'samsung' },
            { name: 'Sony', description: 'Be Moved', slug: 'sony' },
            { name: 'Dell', description: 'The power to do more', slug: 'dell' },
            { name: 'Canon', description: 'Delighting You Always', slug: 'canon' }
        ]);

        // 4. Create Products (6) linked to above
        // Helper to find ID
        const getCatId = (name) => categories.find(c => c.name === name)?._id;
        const getBrandId = (name) => brands.find(b => b.name === name)?._id;

        const products = [
            {
                name: 'MacBook Pro 16',
                description: 'Apple M3 Max chip with 16-core CPU',
                price: 2499,
                countInStock: 10,
                stock: 10,
                category: getCatId('Laptops'),
                brand: getBrandId('Apple'),
                images: ['/images/macbook.jpg'],
                user: adminUser,
                slug: 'macbook-pro-16',
                sku: 'MBP16-001',
                isPublished: true
            },
            {
                name: 'Dell XPS 15',
                description: '13th Gen Intel Core i9',
                price: 1899,
                countInStock: 15,
                stock: 15,
                category: getCatId('Laptops'),
                brand: getBrandId('Dell'),
                images: ['/images/xps15.jpg'],
                user: adminUser,
                slug: 'dell-xps-15',
                sku: 'XPS15-002',
                isPublished: true
            },
            {
                name: 'iPhone 15 Pro',
                description: 'Titanium design, A17 Pro chip',
                price: 999,
                countInStock: 20,
                stock: 20,
                category: getCatId('Smartphones'),
                brand: getBrandId('Apple'),
                images: ['/images/iphone15.jpg'],
                user: adminUser,
                slug: 'iphone-15-pro',
                sku: 'IP15P-003',
                isPublished: true
            },
            {
                name: 'Samsung Galaxy S24',
                description: 'Galaxy AI is here',
                price: 799,
                countInStock: 25,
                stock: 25,
                category: getCatId('Smartphones'),
                brand: getBrandId('Samsung'),
                images: ['/images/s24.jpg'],
                user: adminUser,
                slug: 'samsung-galaxy-s24',
                sku: 'SGS24-004',
                isPublished: true
            },
            {
                name: 'Sony WH-1000XM5',
                description: 'Industry leading noise cancellation',
                price: 349,
                countInStock: 30,
                stock: 30,
                category: getCatId('Headphones'),
                brand: getBrandId('Sony'),
                images: ['/images/xm5.jpg'],
                user: adminUser,
                slug: 'sony-wh-1000xm5',
                sku: 'XM5-005',
                isPublished: true
            },
            {
                name: 'Canon EOS R5',
                description: '8K video recording, 45MP sensor',
                price: 3899,
                countInStock: 5,
                stock: 5,
                category: getCatId('Cameras'),
                brand: getBrandId('Canon'),
                images: ['/images/r5.jpg'],
                user: adminUser,
                slug: 'canon-eos-r5',
                sku: 'R5-006',
                isPublished: true
            }
        ];

        await Product.insertMany(products);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
