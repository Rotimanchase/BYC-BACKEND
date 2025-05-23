
import Wishlist from "../models/wishlist.js";

export const addToWishlist = async (req, res) => {
  const userId = req.userId; // Assuming auth middleware sets this
  const { productId } = req.body;

  try {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    // Check if product already exists in wishlist
    if (!wishlist.items.find(item => item.productId.toString() === productId)) {
      wishlist.items.push({ productId });
      await wishlist.save();
    }

    // Populate product details
    await wishlist.populate('items.productId');
    res.json({ success: true, items: wishlist.items.map(item => item.productId) });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Error adding to wishlist' });
  }
};

export const getWishlist = async (req, res) => {
  const userId = req.userId;

  try {
    const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    res.json({ success: true, items: wishlist ? wishlist.items.map(item => item.productId) : [] });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Error fetching wishlist' });
  }
};

export const removeFromWishlist = async (req, res) => {
  const userId = req.userId;
  const { productId } = req.body;

  try {
    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
      await wishlist.save();
      await wishlist.populate('items.productId');
      res.json({ success: true, items: wishlist.items.map(item => item.productId) });
    } else {
      res.json({ success: true, items: [] });
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Error removing from wishlist' });
  }
};