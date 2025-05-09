import Order from "../models/order.js";
import Product from "../models/product.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  try {
    const { userId, items, address, paymentType, subtotal, deliveryFee, total } = req.body;
    // console.log('Creating order:', {
    //   userId,
    //   items: items.map(item => ({
    //     product: item.product,
    //     quantity: item.quantity,
    //     size: item.size,
    //     color: item.color,
    //     name: item.name,
    //     price: item.price
    //   })),
    //   address,
    //   paymentType,
    //   subtotal,
    //   deliveryFee,
    //   total
    // });

    // Validate items
    for (const item of items) {
      const { product, quantity, size, color } = item;
      const productData = await Product.findById(product);
      if (!productData) {
        console.warn('Product not found:', product);
        return res.status(404).json({ success: false, message: `Product not found: ${product}` });
      }
      if (!productData.inStock) {
        console.warn('Product out of stock:', product);
        return res.status(400).json({ success: false, message: `Product out of stock: ${productData.productName}` });
      }
      if (size && !productData.sizes.includes(size)) {
        console.warn('Invalid size:', { product, size });
        return res.status(400).json({ success: false, message: `Invalid size: ${size}` });
      }
      if (color && !productData.colors.includes(color)) {
        console.warn('Invalid color:', { product, color });
        return res.status(400).json({ success: false, message: `Invalid color: ${color}` });
      }

      // Check and update stock
      let stockEntry = null;
      let newQuantity = null;
      if (size && color) {
        stockEntry = productData.stock.find(
          (entry) => entry.size === size && entry.color === color
        );
        if (!stockEntry || stockEntry.quantity < quantity) {
          console.warn('Insufficient stock:', {
            product,
            size,
            color,
            requested: quantity,
            available: stockEntry?.quantity || 0
          });
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${productData.productName} (${size}/${color}): ${stockEntry?.quantity || 0} available`
          });
        }
        stockEntry.quantity -= quantity;
        newQuantity = stockEntry.quantity;
      } else {
        if (productData.productStock < quantity) {
          console.warn('Insufficient total stock:', {
            product,
            requested: quantity,
            available: productData.productStock
          });
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${productData.productName}: ${productData.productStock} available`
          });
        }
        productData.productStock -= quantity;
        newQuantity = productData.productStock;
      }
      await productData.save();
      // console.log('Updated stock:', { product, size, color, newQuantity });
    }

    // Create order
    const order = new Order({
      userId,
      items,
      address,
      paymentType,
      subtotal,
      deliveryFee,
      total,
      status: 'pending'
    });
    await order.save();
    // console.log('Order created:', { id: order._id, items: order.items });

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId })
      .populate({
        path: 'items.product',
        select: 'productName productImage category',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 });
    // console.log('Raw user orders:', JSON.stringify(orders, null, 2));
    const sanitizedOrders = orders.map(order => ({
      ...order._doc,
      items: order.items.map(item => {
        const productData = item.product
          ? {
              productName: item.product.productName || item.name || 'Unknown Product',
              productImage:
                item.product.productImage
                  ? Array.isArray(item.product.productImage) && item.product.productImage.length > 0
                    ? item.product.productImage
                    : typeof item.product.productImage === 'string' && item.product.productImage.trim()
                      ? [item.product.productImage]
                      : null
                  : null,
              category: item.product.category && item.product.category.name
                ? { name: item.product.category.name }
                : { name: 'Uncategorized' }
            }
          : {
              productName: item.name || 'Deleted Product',
              productImage: null,
              category: { name: 'Uncategorized' }
            };
        return {
          ...item._doc,
          product: productData,
          size: item.size || 'N/A',
          color: item.color || 'N/A'
        };
      })
    }));
    // console.log('Sanitized user orders:', JSON.stringify(sanitizedOrders, null, 2));
    res.status(200).json({ success: true, orders: sanitizedOrders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'productName')
      .sort({ createdAt: -1 });
    // console.log('Raw all orders:', JSON.stringify(orders, null, 2));
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};