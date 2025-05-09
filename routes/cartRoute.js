import express from 'express';
import { addToCart, getCart, removeFromCart, clearCart, updateCart } from '../controllers/cartController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Routes for cart operations
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCart);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

export default router;