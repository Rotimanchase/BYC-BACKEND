import express from 'express';
import { addProduct, addReview, changeStock, deleteProduct, getProduct, productList, updateProduct } from '../controllers/productController.js';
import { uploadMiddleware } from '../config/multer.js';
import adminAuth from '../middlewares/adminAuth.js';
import auth from '../middlewares/auth.js';

const productRouter = express.Router();

// Debug middleware to log raw request
const logRawRequest = (req, res, next) => {
  console.log('Raw request headers:', req.headers);
  console.log('Raw request body (before Multer):', req.body);
  next();
};

// Test route to bypass Multer and adminAuth
productRouter.post('/add-test', logRawRequest, (req, res) => {
  console.log('Test route hit');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files || 'No files');
  res.json({ success: true, message: 'Test route reached', body: req.body, files: req.files });
});

productRouter.post('/add', logRawRequest, uploadMiddleware, adminAuth, addProduct);
productRouter.get('/', productList);
productRouter.get('/:id', getProduct);
productRouter.put('/:id', updateProduct);
productRouter.delete('/:id', deleteProduct);
productRouter.post('/stock', adminAuth, changeStock);
productRouter.post('/:id/review', auth, addReview);

export default productRouter;