import express from 'express'
import { createCategory, deleteCategory, getAll, getSingleCategory, updateCategory } from '../controllers/categorycontroller.js'

const categoryRouter = express.Router()

categoryRouter.get('/', getAll)
categoryRouter.post('/', createCategory)
categoryRouter.put('/:id', updateCategory)
categoryRouter.get('/:id', getSingleCategory)
categoryRouter.delete('/:id', deleteCategory)

export default categoryRouter;