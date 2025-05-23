import Cart from '../models/cart.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';

export const addToCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { productId, quantity, size, color } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required: No user ID provided' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.productStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.productStock} items available in stock`,
      });
    }

    if (size && product.sizes?.length > 0 && !product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size. Available sizes: ${product.sizes.join(', ')}`,
      });
    }

    if (color && product.colors?.length > 0 && !product.colors.includes(color)) {
      return res.status(400).json({
        success: false,
        message: `Invalid color. Available colors: ${product.colors.join(', ')}`,
      });
    }

    if (product.stock?.length > 0) {
      const stockItem = product.stock.find(
        (item) => item.size === size && item.color === color && item.quantity >= quantity
      );
      if (!stockItem) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock.find((item) => item.size === size && item.color === color)?.quantity || 0} available for ${size}/${color}`,
        });
      }
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], total: 0 });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || null) === (size || null) &&
        (item.color || null) === (color || null)
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size: size || null, color: color || null });
    }

    cart.total = cart.items.reduce((total, item) => {
      return total + (product.productPrice * item.quantity);
    }, 0);

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    console.error('Add to cart error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required: No user ID provided' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'productName productPrice productStock productImage productDescription productNumber sizes colors',
    });

    if (!cart) {
      return res.json({ success: true, cart: { items: [], total: 0 } });
    }

    // Filter out invalid items (e.g., deleted products)
    const validItems = cart.items.filter((item) => item.productId);
    if (validItems.length < cart.items.length) {
      console.warn('Some cart items have invalid product references:', {
        invalidItems: cart.items.filter((item) => !item.productId),
      });
      cart.items = validItems;
      await cart.save();
    }

    res.json({ success: true, cart });
  } catch (error) {
    console.error('Get cart error:', {
      message: error.message,
      stack: error.stack,
      userId,
    });
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { productId, quantity, size, color } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required: No user ID provided' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.productStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.productStock} items available in stock`,
      });
    }

    if (size && product.sizes?.length > 0 && !product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: `Invalid size. Available sizes: ${product.sizes.join(', ')}`,
      });
    }

    if (color && product.colors?.length > 0 && !product.colors.includes(color)) {
      return res.status(400).json({
        success: false,
        message: `Invalid color. Available colors: ${product.colors.join(', ')}`,
      });
    }

    if (product.stock?.length > 0) {
      const stockItem = product.stock.find(
        (item) => item.size === size && item.color === color && item.quantity >= quantity
      );
      if (!stockItem) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock.find((item) => item.size === size && item.color === color)?.quantity || 0} available for ${size}/${color}`,
        });
      }
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || null) === (size || null) &&
        (item.color || null) === (color || null)
    );

    if (itemIndex < 0) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].size = size || null;
    cart.items[itemIndex].color = color || null;

    cart.total = cart.items.reduce((total, item) => {
      return total + (product.productPrice * item.quantity);
    }, 0);

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate('items.productId');


    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    console.error('Update cart error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { productId, size, color } = req.body;
    // console.log('Remove from cart:', { userId, productId, size, color });

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required: No user ID provided' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      // console.log('Cart not found for user:', userId);
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || null) === (size || null) &&
        (item.color || null) === (color || null)
    );

    if (itemIndex < 0) {
      // console.log('Item not found in cart:', { productId, size, color });
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);

    cart.total = cart.items.reduce((total, item) => {
      const product = Product.findById(item.productId);
      return total + (product?.productPrice * item.quantity || 0);
    }, 0);

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    console.error('Remove from cart error:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: true, message: "Cart not found" });
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    return res.json({ success: true, message: "Cart cleared", cart });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};