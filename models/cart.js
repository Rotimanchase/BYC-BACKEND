import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      size: {
        type: String,
        enum: ["S", "M", "L", "XL", "XXL", null],
        default: null,
      },
      color: {
        type: String,
        enum: ["Red", "Blue", "Green", "Black", "White", "Yellow", null],
        default: null,
      },
    },
  ],
  total: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;