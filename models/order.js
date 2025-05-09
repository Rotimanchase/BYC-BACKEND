import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
      },
      name: {
        type: String,
        required: true
      },
      variant: {
        type: String
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      size: { 
        type: String 
      },
      color: { 
        type: String 
      }
    }
  ],
  address: {
    fullname: { type: String, required: true },
    company: { type: String },
    country: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['Bank Transfer', 'Online Payment']
  },
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  }
}, {timestamps: true});

const Order = mongoose.model('order', orderSchema);

export default Order;

