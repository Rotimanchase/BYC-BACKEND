import express from 'express';
import auth from '../middlewares/auth.js';
import { createOrder, getUserOrders, getAllOrders } from '../controllers/orderController.js';
import adminAuth from '../middlewares/adminAuth.js';

const orderRouter = express.Router();

orderRouter.get('/user', auth, getUserOrders);
orderRouter.post('/create', auth, createOrder);
orderRouter.get('/admin', getAllOrders);

export default orderRouter;