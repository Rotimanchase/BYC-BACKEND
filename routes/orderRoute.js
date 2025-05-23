// routes/orderRouter.js
import express from 'express';
import auth from '../middlewares/auth.js';
import { createOrder, getUserOrders, getAllOrders, createOrderStripe, verifyStripePayment, stripeWebhook, markOrderAsPaid, cancelOrder } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.get('/user', auth, getUserOrders);
orderRouter.post('/create', auth, createOrder);
orderRouter.post('/stripe', auth, createOrderStripe);
orderRouter.get('/admin', getAllOrders);
orderRouter.post('/verify-payment', auth, verifyStripePayment);
orderRouter.patch('/:orderId/mark-paid', markOrderAsPaid); // Fixed typo and clarified parameter
orderRouter.patch('/:orderId/cancel', cancelOrder);

export default orderRouter;