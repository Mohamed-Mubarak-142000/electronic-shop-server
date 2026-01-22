import Product from '../models/Product.js';

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
