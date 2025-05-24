import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import userRouter from "./routes/userRoute.js";
import adminRouter from "./routes/adminRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import blogRouter from "./routes/blogRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import wishlistRouter from "./routes/wishlistRoute.js";

import connectCloudinary from "./config/cloudinary.js";
import connectDB from "./config/db.js";
import { stripeWebhook } from "./controllers/orderController.js";

const app = express();

// Verify JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}
console.log("✅ JWT_SECRET loaded successfully");

// Connect to Cloudinary and MongoDB
try {
  await connectCloudinary();
  await connectDB();
  console.log("✅ Connected to Cloudinary and MongoDB");
} catch (err) {
  console.error("❌ Failed to connect to service:", err.message);
  process.exit(1);
}

// Stripe Webhook (must come before bodyParser)
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

// Middleware
app.use(express.json());

const allowOrigins = [
  "http://localhost:5173",
  "https://byc-zeta.vercel.app",
  "https://byc-backend.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowOrigins.includes(origin) || origin.includes(".vercel.app")) {
        return callback(null, true);
      }
      console.warn("❌ CORS blocked:", origin);
      return callback(new Error("CORS not allowed for this origin"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 200,
  })
);

// Routes
app.get("/", (req, res) => res.send("API is running..."));

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/blog", blogRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/wishlist", wishlistRouter);

// Server Listen
const PORT = process.env.PORT || 4800;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));