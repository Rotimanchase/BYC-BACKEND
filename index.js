// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Core imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from 'config';

// Import models
import './models/product.js';
import './models/cart.js';
import './models/user.js';

// Import routes
import userRouter from './routes/userRoute.js';
import adminRouter from './routes/adminRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import blogRouter from './routes/blogRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import wishlistRouter from './routes/wishlistRoute.js';

// Import utilities
import connectCloudinary from './config/cloudinary.js';
import connectDB from './config/db.js';
import { stripeWebhook } from './controllers/orderController.js';

const app = express();

// ==================
// ✅ JWT CONFIGURATION
// ==================
let jwtKey;
try {
  jwtKey = config.get('jwtPrivateKey');
} catch (error) {
  jwtKey = process.env.JWT_SECRET;
}

if (!jwtKey) {
  console.error('❌ FATAL ERROR: JWT key is not defined.');
  process.exit(1);
}

process.env.JWT_SECRET = jwtKey; // Make sure other files using process.env.JWT_SECRET can access it
console.log('✅ JWT key loaded successfully');

// ==================
// ✅ CONNECT CLOUDINARY & DB
// ==================
try {
  await connectCloudinary();
  await connectDB();
  console.log('✅ Connected to Cloudinary and MongoDB');
} catch (err) {
  console.error('❌ Failed to connect to service:', err.message);
  process.exit(1);
}

// ==================
// ✅ STRIPE WEBHOOK (must come before bodyParser)
// ==================
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// ==================
// ✅ MIDDLEWARE
// ==================
app.use(express.json());

const allowOrigins = [
  'http://localhost:5173',
  'https://byc-zeta.vercel.app',
  'https://byc-backend.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowOrigins.includes(origin) || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    console.warn('❌ CORS blocked:', origin);
    return callback(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  optionsSuccessStatus: 200
}));

// ==================
// ✅ ROUTES
// ==================
app.get('/', (req, res) => res.send('API is running...'));

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/blog', blogRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/wishlist', wishlistRouter);

// ==================
// ✅ SERVER LISTEN
// ==================
const PORT = process.env.PORT || 4800;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
