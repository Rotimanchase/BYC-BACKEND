import Blog from '../models/blog.js';

export const createBlog = async (req, res) => {
  try {
    if (!req.body) {
      // console.log('No req.body received');
      return res.status(400).json({ success: false, message: 'No form data received.' });
    }

    const { blogTitle, blogDescription, authorName, authorTitle, blogImage, authorImage } = req.body;

    // Validate inputs
    if (!blogImage || !blogImage.startsWith('https://res.cloudinary.com/')) {
      return res.status(400).json({ success: false, message: 'A valid Cloudinary blog image URL is required.' });
    }
    if (!authorImage || !authorImage.startsWith('https://res.cloudinary.com/')) {
      return res.status(400).json({ success: false, message: 'A valid Cloudinary author image URL is required.' });
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
      blogImage, // Cloudinary URL
      blogTitle,
      blogDescription: blogDescription || undefined,
      authorImage, // Cloudinary URL
      authorName,
      authorTitle,
    });
    await blog.save();

    // console.log('Blog created:', { id: blog._id, title: blogTitle });
    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};