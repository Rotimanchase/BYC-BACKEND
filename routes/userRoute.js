import express from 'express';
import { register, login, me, getRecentlyViewed, addRecentlyViewed, clearRecentlyViewed } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.get('/recently-viewed', auth, getRecentlyViewed);
router.post('/recently-viewed', auth, addRecentlyViewed);
router.delete('/recently-viewed', auth, clearRecentlyViewed);

export default router;