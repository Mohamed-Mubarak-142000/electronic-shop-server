import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';

export const getPortfolios = async (req, res) => {
    try {
        const portfolios = await Portfolio.find({ isPublished: true }).populate('user', 'name companyName');
        res.json(portfolios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPortfolioById = async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id);
        if (portfolio) {
            res.json(portfolio);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createPortfolio = async (req, res) => {
    try {
        const portfolio = await Portfolio.create({ ...req.body, user: req.user._id });
        res.status(201).json(portfolio);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePortfolio = async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id);
        if (portfolio) {
            Object.assign(portfolio, req.body);
            const updatedPortfolio = await portfolio.save();
            res.json(updatedPortfolio);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deletePortfolio = async (req, res) => {
    try {
        const portfolio = await Portfolio.findById(req.params.id);
        if (portfolio) {
            await portfolio.deleteOne();
            res.json({ message: 'Project removed' });
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOwnerPortfolio = async (req, res) => {
    try {
        const owner = await User.findOne({ role: 'admin' });
        if (!owner) return res.status(404).json({ message: 'Owner not found' });

        const portfolios = await Portfolio.find({ user: owner._id, isPublished: true });
        res.json({ owner, portfolios });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
