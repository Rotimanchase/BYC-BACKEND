import express from 'express'
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import auth from '../middlewares/auth.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', auth, addToWishlist);
wishlistRouter.get('/', auth, getWishlist);
wishlistRouter.post('/remove', auth, removeFromWishlist);

export default wishlistRouter