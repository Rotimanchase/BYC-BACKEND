import mongoose from "mongoose";
import { categorySchema } from "./category.js";

const reviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
        trim: true
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    productNumber: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    category: {
        type: categorySchema,
        required: true
    },
    productPrice: {
        type: Number,
        required: true,
        min: 0
    },
    productStock: {
        type: Number,
        required: true,
        min: 0,
    },
    productImage: {
        type: [String],
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500
    },
    inStock: {
        type: Boolean,
        default: true
    },
    ratings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    sizes: {
        type: [String],
        default: [],
        enum: ['S', 'M', 'L', 'XL', 'XXL']
    },
    colors: {
        type: [String],
        default: [],
        enum: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow']
    },
    stock: [
        {
            size: { type: String, enum: ['S', 'M', 'L', 'XL', 'XXL'], required: true },
            color: { type: String, enum: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'], required: true },
            quantity: { type: Number, required: true, min: 0 }
        }
    ],
    reviews: {
        type: [reviewSchema],
        default: []
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;