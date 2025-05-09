import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './models/product.js';  // This will register the Product model
import './models/cart.js';
import './models/user.js';

// Load environment variables first, before any other imports
dotenv.config();

import mongoose from 'mongoose';
import config from 'config';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRouter from './routes/userRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import connectCloudinary from './config/cloudinary.js';
import blogRouter from './routes/blogRoute.js';
import adminRouter from './routes/adminRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import wishlistRouter from './routes/wishlistRoute.js';
// import debugRouter from './routes/debugRoute.js'; // Import the debug route

const app = express();

// Check environment variables
// console.log('Environment variables loaded:');
// console.log('- JWT_SECRET available:', !!process.env.JWT_SECRET);
// console.log('- NODE_ENV:', process.env.NODE_ENV);

// Check if using config package or direct env variables
let jwtKey;
try {
  jwtKey = config.get('jwtPrivateKey');
  // console.log('Using jwtPrivateKey from config package');
} catch (error) {
  jwtKey = process.env.JWT_SECRET;
  // console.log('Using JWT_SECRET from environment variables');
}

if (!jwtKey) {
  console.error('FATAL ERROR: JWT key is not defined.');
  process.exit(1);
}

// Set a consistent JWT secret
process.env.JWT_SECRET = jwtKey;

await connectCloudinary();

mongoose
  .connect('mongodb://localhost/byc-server')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Could not connect to MongoDB', err));

const allowOrigins = ['http://localhost:5173'];

app.use(express.json());
app.use(cors({
  origin: allowOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// Serve static files from Uploads directory
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/Uploads', express.static('Uploads'));

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/blog', blogRouter);
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)
app.use('/api/wishlist', wishlistRouter)

// Simple test route for JWT
// app.get('/api/test-jwt', (req, res) => {
//   res.json({
//     message: 'JWT configured with:',
//     jwt_secret_available: !!process.env.JWT_SECRET,
//     jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
//   });
// });
// // Global error handler
// app.use((err, req, res, next) => {
//     console.error('Unhandled error:', err.message, err.stack);
//     res.status(500).json({ success: false, message: `Server error: ${err.message}` });
//   });
  

const port = process.env.PORT || 4800;
app.listen(port, () => console.log(`listening on port ${port}...`));