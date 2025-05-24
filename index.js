import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import './models/product.js';
import './models/cart.js';
import './models/user.js';


import mongoose from 'mongoose';
import config from 'config';
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
import { stripeWebhook } from './controllers/orderController.js';
import connectDB from './config/db.js';

const app = express();

// Check JWT key
let jwtKey;
try {
  jwtKey = config.get('jwtPrivateKey');
} catch (error) {
  jwtKey = process.env.JWT_SECRET;
}

if (!jwtKey) {
  console.error('FATAL ERROR: JWT key is not defined.');
  process.exit(1);
}

process.env.JWT_SECRET = jwtKey;

try {
  connectCloudinary();
} catch (error) {
  console.error('Failed to start server due to Cloudinary error:', error.message);
  process.exit(1);
}

await connectDB();

// const allowOrigins = ['http://localhost:5173', 'https://byc-backend.vercel.app'];

app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhook);

app.get('/', (req, res) => {
  res.send('API is running...');
});


const allowOrigins = [
  'http://localhost:5173',
  'https://byc-zeta.vercel.app', // Remove trailing slash
  'https://byc-backend.vercel.app', // Add your backend URL too
];

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Request origin:', origin); // Debug log
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a vercel app
    if (allowOrigins.includes(origin) || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    console.warn('❌ CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));


app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/blog', blogRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/wishlist', wishlistRouter);

const port = process.env.PORT || 4800;
app.listen(port, () => console.log(`listening on port ${port}...`));