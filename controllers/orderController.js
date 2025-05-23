import Order from "../models/order.js";
import Product from "../models/product.js";
import mongoose from "mongoose";
import Stripe from "stripe";

let stripeInstance = null;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  }
  return stripeInstance;
};

export const createOrderStripe = async (req, res) => {
  try {
    const stripe = getStripe(); // Initialize here instead of at module level
    
    const { userId, items, address, subtotal, deliveryFee, total } = req.body;
    const { origin } = req.headers;

    if (!address || !items || items.length === 0 || !subtotal || !deliveryFee || !total) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate stock availability (don't update yet)
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.product}` 
        });
      }
      if (!product.inStock || product.productStock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.productName}` 
        });
      }
    }

    // Create order with pending status
    const order = await Order.create({
      userId,
      items,
      address,
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      paymentType: 'Online Payment',
      paymentStatus: 'pending'
    });

    // Create line items for Stripe
    const line_items = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        return {
          price_data: {
            currency: 'ngn',
            product_data: {
              name: product.productName,
              description: product.productDescription || '',
            },
            unit_amount: Math.round(product.productPrice * 100), // Convert to kobo
          },
          quantity: item.quantity,
        };
      })
    );

    // Add delivery fee as separate line item
    if (deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: 'ngn',
          product_data: {
            name: 'Delivery Fee',
            description: 'Shipping and handling charges',
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      customer_email: address.email,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });

    console.log('Stripe session created:', { sessionId: session.id, orderId: order._id });

    return res.json({ success: true, url: session.url, orderId: order._id });
  } catch (error) {
    console.error('Stripe order creation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyStripePayment = async (req, res) => {
  try {
    const stripe = getStripe(); // Use the lazy-loaded instance
    
    const { session_id, order_id } = req.body;

    if (!session_id || !order_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID and Order ID are required' 
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    // Find and update order
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.json({ 
        success: true, 
        message: 'Payment already processed',
        order 
      });
    }

    // Update stock now that payment is confirmed
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.productStock >= item.quantity) {
        product.productStock -= item.quantity;
        await product.save();
        console.log(`Updated stock for ${product.productName}: ${product.productStock}`);
      }
    }

    // Update order status
    order.paymentStatus = 'completed';
    order.status = 'confirmed';
    order.stripeSessionId = session_id;
    await order.save();

    console.log('Payment verified and order updated:', order._id);

    return res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      order 
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// export const markOrderAsPaid = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     if (order.paymentType !== 'Bank Transfer') {
//       return res.status(400).json({
//         success: false,
//         message: 'Manual payment updates are only allowed for Bank Transfer orders'
//       });
//     }
    
//     console.log('Marking order as paid:', orderId);
    
//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order ID is required'
//       });
//     }

//     // Find the order
//     const order = await Order.findById(orderId);
    
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Check if already paid
//     if (order.paymentStatus === 'completed') {
//       return res.json({
//         success: true,
//         message: 'Order is already marked as paid',
//         order
//       });
//     }

//     // Update payment status
//     order.paymentStatus = 'completed';
//     order.status = 'confirmed'; // Also update order status
    
//     // Add a note about manual payment confirmation
//     if (!order.notes) {
//       order.notes = [];
//     }
//     if (Array.isArray(order.notes)) {
//       order.notes.push({
//         message: 'Payment manually confirmed by admin',
//         timestamp: new Date(),
//         type: 'payment_confirmed'
//       });
//     }

//     await order.save();

//     console.log('Order marked as paid successfully:', orderId);

//     res.json({
//       success: true,
//       message: 'Order marked as paid successfully',
//       order
//     });

//   } catch (error) {
//     console.error('Error marking order as paid:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// controllers/orderController.js

export const markOrderAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Attempting to mark order as paid:', orderId);
    if (!orderId) {
      console.log('Validation failed: Order ID is required');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Validation failed: Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    console.log('Order found:', { paymentType: order.paymentType, paymentStatus: order.paymentStatus });
    if (order.paymentType !== 'Bank Transfer') {
      console.log('Validation failed: Payment type is', order.paymentType);
      return res.status(400).json({
        success: false,
        message: 'Manual payment updates are only allowed for Bank Transfer orders',
      });
    }

    if (order.paymentStatus !== 'pending') {
      console.log('Validation failed: Payment status is', order.paymentStatus);
      return res.status(400).json({
        success: false,
        message: 'Order cannot be marked as paid from its current state',
      });
    }

    order.paymentStatus = 'completed';
    order.status = 'confirmed';
    order.notes = order.notes || [];
    const note = {
      message: 'Payment manually confirmed by admin',
      timestamp: new Date(),
      type: 'payment_confirmed',
    };
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      note.adminId = req.user.id;
    }
    order.notes.push(note);

    await order.save();
    console.log('Order marked as paid successfully:', orderId);

    res.json({
      success: true,
      message: 'Order marked as paid successfully',
      order,
    });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Attempting to cancel order:', orderId);
    if (!orderId) {
      console.log('Validation failed: Order ID is required');
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Validation failed: Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'pending') {
      console.log('Validation failed: Order status is', order.status);
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled',
      });
    }

    // Restore stock for each item
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.log('Product not found for ID:', item.product);
        return res.status(404).json({
          success: false,
          message: `Product not found for ID: ${item.product}`,
        });
      }
      product.productStock = (product.productStock || 0) + item.quantity;
      await product.save();
      console.log(`Restored ${item.quantity} units to product ${item.product}`);
    }

    order.status = 'cancelled';
    order.paymentStatus = 'failed';
    order.notes = order.notes || [];
    const note = {
      message: 'Order manually cancelled by admin',
      timestamp: new Date(),
      type: 'order_cancelled',
    };
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      note.adminId = req.user.id;
    }
    order.notes.push(note);

    await order.save();
    console.log('Order cancelled successfully:', orderId);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Webhook to handle Stripe events
export const stripeWebhook = async (req, res) => {
  try {
    const stripe = getStripe(); // Use the lazy-loaded instance
    
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const orderId = session.metadata.orderId;
        
        console.log('Checkout session completed:', session.id);
        
        // Update order status
        if (orderId) {
          try {
            const order = await Order.findById(orderId);
            if (order && order.paymentStatus !== 'completed') {
              // Update stock
              for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product && product.productStock >= item.quantity) {
                  product.productStock -= item.quantity;
                  await product.save();
                }
              }
              
              order.paymentStatus = 'completed';
              order.status = 'confirmed';
              order.stripeSessionId = session.id;
              await order.save();
              
              console.log('Order updated via webhook:', orderId);
            }
          } catch (error) {
            console.error('Error updating order via webhook:', error);
          }
        }
        break;
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object;
        const expiredOrderId = expiredSession.metadata.orderId;
        
        if (expiredOrderId) {
          try {
            await Order.findByIdAndUpdate(expiredOrderId, {
              status: 'cancelled',
              paymentStatus: 'failed'
            });
            console.log('Order cancelled due to expired session:', expiredOrderId);
          } catch (error) {
            console.error('Error cancelling expired order:', error);
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createOrder = async (req, res) => {
  try {
    const { userId, items, address, paymentType, subtotal, deliveryFee, total } = req.body;

    // Validate and update stock for bank transfer orders
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

      // Update stock immediately for bank transfer
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
      await productData.save();
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
      status: 'pending',
      paymentStatus: paymentType === 'Bank Transfer' ? 'pending' : 'completed'
    });
    await order.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId })
      .populate({
        path: 'items.product',
        select: 'productName productImage category',
        populate: { path: 'category', select: 'name' }
      }).sort({ createdAt: -1 });
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
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};