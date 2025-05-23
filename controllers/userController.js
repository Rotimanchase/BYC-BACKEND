import User from '../models/user.js';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import Product from '../models/product.js'; // Adjust path as needed

export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Please fill all the fields' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser)
            return res.json({ success: false, message: 'User already exist' });

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hashPassword,
            recentlyViewed: [], // Initialize empty array
        });

        const token = user.generateAuthToken();
        return res.json({ success: true, token, user: _.pick(user, ['_id', 'name', 'email']) });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.json({ success: false, message: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return res.json({ success: false, message: 'Invalid email or password' });

        const token = user.generateAuthToken();
        return res.json({
            success: true,
            token,
            user: _.pick(user, ['_id', 'name', 'email']),
        });
    } catch (error) {
        // console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.json({ success: false, message: 'user not found' });
        }
        return res.json({ success: true, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getRecentlyViewed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('recentlyViewed');
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, recentlyViewed: user.recentlyViewed });
    } catch (error) {
        console.error('Error fetching recently viewed:', error);
        return res.json({ success: false, message: 'Server error' });
    }
};

export const addRecentlyViewed = async (req, res) => {
    const { productId } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }
        // Remove duplicates and add to start
        user.recentlyViewed = user.recentlyViewed.filter(id => id.toString() !== productId);
        user.recentlyViewed.unshift(productId);
        // Limit to 5
        user.recentlyViewed = user.recentlyViewed.slice(0, 5);
        await user.save();
        // Return populated data
        const updatedUser = await User.findById(req.user._id).populate('recentlyViewed');
        return res.json({ success: true, recentlyViewed: updatedUser.recentlyViewed });
    } catch (error) {
        console.error('Error adding recently viewed:', error);
        return res.json({ success: false, message: 'Server error' });
    }
};

export const clearRecentlyViewed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        user.recentlyViewed = [];
        await user.save();
        return res.json({ success: true, recentlyViewed: [] });
    } catch (error) {
        console.error('Error clearing recently viewed:', error);
        return res.json({ success: false, message: 'Server error' });
    }
};