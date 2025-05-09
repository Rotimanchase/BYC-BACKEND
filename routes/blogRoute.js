import express from 'express';
import { createBlog, deleteBlog, getBlogs, incrementViews, incrementLikes, getBlogById } from '../controllers/blogController.js';
import { uploadMiddleware } from '../config/multer.js';

const blogRouter = express.Router();

// Create blog
blogRouter.post('/create', uploadMiddleware, createBlog);

// Other routes
blogRouter.get('/', getBlogs);
blogRouter.delete('/:id', deleteBlog);
blogRouter.patch('/:id/views', incrementViews);
blogRouter.patch('/:id/likes', incrementLikes);
blogRouter.get('/:id', getBlogById);

export default blogRouter;