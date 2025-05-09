import Blog from '../models/blog.js';
import path from 'path';
import fs from 'fs/promises';

export const createBlog = async (req, res) => {
  try {
    console.log('createBlog invoked');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    // Check if req.body and req.files exist
    if (!req.body) {
      console.log('No req.body received');
      return res.status(400).json({ success: false, message: 'No form data received.' });
    }
    if (!req.files || req.files.length < 2) {
      console.log('Insufficient files:', req.files ? req.files.length : 'none');
      return res.status(400).json({ success: false, message: 'Two images (blog and author) are required.' });
    }

    const { blogTitle, blogDescription, authorName, authorTitle } = req.body;
    const blogImage = req.files[0];
    const authorImage = req.files[1];

    // Validate inputs
    if (!blogImage) {
      return res.status(400).json({ success: false, message: 'Blog image is required.' });
    }
    if (!authorImage) {
      return res.status(400).json({ success: false, message: 'Author image is required.' });
    }
    if (!blogTitle || blogTitle.length < 5 || blogTitle.length > 255) {
      return res.status(400).json({ success: false, message: 'Blog title must be between 5 and 255 characters.' });
    }
    if (blogDescription && blogDescription.length < 5) {
      return res.status(400).json({ success: false, message: 'Blog description must be at least 5 characters if provided.' });
    }
    if (!authorName || authorName.length < 2 || authorName.length > 50) {
      return res.status(400).json({ success: false, message: 'Author name must be between 2 and 50 characters.' });
    }
    if (!authorTitle || authorTitle.length < 5 || authorTitle.length > 50) {
      return res.status(400).json({ success: false, message: 'Author title must be between 5 and 50 characters.' });
    }

    // Save blog
    const blog = new Blog({
      blogImage: `/Uploads/${blogImage.filename}`,
      blogTitle,
      blogDescription: blogDescription || undefined,
      authorImage: `/Uploads/${authorImage.filename}`,
      authorName,
      authorTitle,
    });
    await blog.save();

    console.log('Blog created:', { id: blog._id, title: blogTitle });
    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    // Clean up uploaded files on error
    for (const file of req.files || []) {
      await fs.unlink(file.path).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get all blogs
export const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json({ success: true, blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a blog
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByIdAndDelete(id);

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const incrementViews = async (req, res) => {
    try {
      const { id } = req.params;
      const blog = await Blog.findByIdAndUpdate(
        id,
        { $inc: { blogViews: 1 } },
        { new: true }
      );
  
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }
  
      res.json({ success: true, blog: { _id: blog._id, blogViews: blog.blogViews } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  // Increment blog likes
  export const incrementLikes = async (req, res) => {
    try {
      const { id } = req.params;
      const blog = await Blog.findByIdAndUpdate(
        id,
        { $inc: { blogLikes: 1 } },
        { new: true }
      );
  
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }
  
      res.json({ success: true, blog: { _id: blog._id, blogLikes: blog.blogLikes } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

export const getBlogById = async(req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        res.json({ success: true, blog });
        } catch (err) {
        res.status(500).json({ success: false, message: err.message });
        }
}