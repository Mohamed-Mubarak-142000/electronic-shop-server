import Product from '../models/Product.js';
import User from '../models/User.js';

// Helper to create slug
const createSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 12; // Default 12 for grid
        const page = Number(req.query.page) || 1;

        // Filtering
        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        const filter = { ...keyword };

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.brand) {
            filter.brand = req.query.brand;
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }

        if (req.query.isPublished) {
            filter.isPublished = req.query.isPublished === 'true';
        }

        // Sorting
        let sort = '-createdAt'; // Default new to old
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            sort = sortBy;
        }

        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort(sort)
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate('brand', 'name')
            .populate('category', 'name');

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('brand', 'name')
            .populate('category', 'name');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            nameAr,
            price,
            description,
            descriptionAr,
            images,
            brand,
            category,
            countInStock,
            stock,
            sku,
            tags,
            isPublished
        } = req.body;

        const productSlug = createSlug(name) + '-' + Date.now();

        const product = new Product({
            name,
            nameAr,
            slug: productSlug,
            price,
            description,
            descriptionAr,
            images: images || [],
            brand: brand || undefined,
            category: category || undefined,
            stock: stock || countInStock || 0,
            sku: sku || `SKU-${Date.now()}`,
            user: req.user._id,
            tags: tags || [],
            isPublished: isPublished !== undefined ? isPublished : true
        });

        const createdProduct = await Product.create(product);

        // Emit socket event for real-time notification
        if (req.io) {
            req.io.to('notifications').emit('new_product', createdProduct);
        }

        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        const {
            name,
            nameAr,
            price,
            description,
            descriptionAr,
            images,
            brand,
            category,
            stock,
            sku,
            tags,
            isPublished
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.nameAr = nameAr || product.nameAr;
            product.price = price !== undefined ? price : product.price;
            product.description = description || product.description;
            product.descriptionAr = descriptionAr || product.descriptionAr;
            product.images = images || product.images;
            product.brand = brand || product.brand;
            product.category = category || product.category;
            product.stock = stock !== undefined ? stock : product.stock;
            product.sku = sku || product.sku;
            product.tags = tags || product.tags;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;

            if (name && name !== product.name) {
                product.slug = createSlug(name) + '-' + Date.now();
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne(); // Use deleteOne() for Mongoose documents
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recommended products (new for user)
// @route   GET /api/products/recommended
// @access  Private
export const getRecommendedProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const seenIds = user.seenProductIds || [];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find products created > 24h ago AND not in seenIds
        let products = await Product.find({
            isPublished: true,
            createdAt: { $gte: oneDayAgo },
            _id: { $nin: seenIds }
        }).sort('-createdAt').limit(5);

        // If fewer than 5 products found (or none), fall back to just latest unseen products
        if (products.length < 5) {
            const moreProducts = await Product.find({
                isPublished: true,
                _id: { $nin: [...seenIds, ...products.map(p => p._id)] }
            }).sort('-createdAt').limit(5 - products.length);

            products = [...products, ...moreProducts];
        }

        // Mark as seen
        if (products.length > 0) {
            const newIds = products.map(p => p._id);
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { seenProductIds: { $each: newIds } }
            });
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
