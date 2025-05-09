import express from 'express'
import { createAddress, getAddresses } from '../controllers/addressController.js';
import auth from '../middlewares/auth.js';

const addressRouter = express.Router();

addressRouter.post('/', auth, createAddress);
addressRouter.get('/:userId', auth, getAddresses);

export default addressRouter