import express from 'express'
import { adminLogin, adminMe } from '../controllers/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'

const adminRouter = express.Router()

adminRouter.post('/login', adminLogin)
adminRouter.get('/', adminAuth, adminMe)

export default adminRouter;