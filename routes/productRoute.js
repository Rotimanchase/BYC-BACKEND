import express from 'express';
import { addProduct, addReview, changeStock, deleteProduct, getProduct, productList, updateProduct } from '../controllers/productController.js';
import adminAuth from '../middlewares/adminAuth.js';
import auth from '../middlewares/auth.js';

const productRouter = express.Router();

// Test route for debugging


productRouter.post('/add', adminAuth, addProduct);
productRouter.get('/', productList);
productRouter.get('/:id', getProduct);
productRouter.put('/:id', updateProduct);
productRouter.delete('/:id', deleteProduct);
productRouter.post('/stock', adminAuth, changeStock);
productRouter.post('/:id/review', auth, addReview);

export default productRouter;