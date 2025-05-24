import Product from "../models/product.js";
import Category from "../models/category.js";


export const addProduct = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: "Request body is missing or not parsed" });
    }

    const {
      productName,
      productNumber,
      category,
      productPrice,
      productStock,
      productDescription,
      sizes,
      colors,
      stock,
      productImage,
    } = req.body;

    // Validate required fields
    if (
      !productName ||
      !productNumber ||
      !category ||
      !productPrice ||
      !productStock ||
      !productDescription ||
      !productImage ||
      !Array.isArray(productImage) ||
      productImage.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${[
          !productName && "productName",
          !productNumber && "productNumber",
          !category && "category",
          !productPrice && "productPrice",
          !productStock && "productStock",
          !productDescription && "productDescription",
          (!productImage || !Array.isArray(productImage) || productImage.length === 0) && "productImage",
        ]
          .filter(Boolean)
          .join(", ")}`,
      });
    }

    // Validate image URLs
    for (const url of productImage) {
      if (!url || typeof url !== "string" || !url.startsWith("https://res.cloudinary.com/")) {
        return res.status(400).json({
          success: false,
          message: `Invalid image URL: ${url}. Must be a valid Cloudinary URL`,
        });
      }
    }

    // Validate category
    const validCategories = ["Men", "Women", "Children"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(", ")}`,
      });
    }
    let categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc) {
      // Auto-create category if not found
      categoryDoc = await Category.create({ name: category });
      console.log(`Created category: ${category}`);
    } else {
      console.log(`Found category: ${category}`);
    }

    // Validate price and stock
    const price = Number(productPrice);
    const stockTotal = Number(productStock);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: "Product price must be a non-negative number" });
    }
    if (isNaN(stockTotal) || stockTotal < 1) {
      return res.status(400).json({ success: false, message: "Stock must be at least 1" });
    }

    // Validate sizes and colors
    const validSizes = ["S", "M", "L", "XL", "XXL"];
    const validColors = ["Red", "Blue", "Green", "Black", "White", "Yellow"];
    const sizesArray = Array.isArray(sizes) ? sizes : sizes ? JSON.parse(sizes) : [];
    const colorsArray = Array.isArray(colors) ? colors : colors ? JSON.parse(colors) : [];
    if (sizesArray.some((size) => !validSizes.includes(size))) {
      return res.status(400).json({
        success: false,
        message: `Sizes must be one of: ${validSizes.join(", ")}`,
      });
    }
    if (colorsArray.some((color) => !validColors.includes(color))) {
      return res.status(400).json({
        success: false,
        message: `Colors must be one of: ${validColors.join(", ")}`,
      });
    }

    // Validate stock array
    let stockArray = [];
    if (stock) {
      stockArray = Array.isArray(stock) ? stock : JSON.parse(stock);
      if (!Array.isArray(stockArray)) {
        return res.status(400).json({
          success: false,
          message: "Stock must be an array of { size, color, quantity }",
        });
      }
      for (const item of stockArray) {
        if (
          !item.size ||
          !validSizes.includes(item.size) ||
          !item.color ||
          !validColors.includes(item.color) ||
          typeof item.quantity !== "number" ||
          item.quantity < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid stock item: ${JSON.stringify(item)}. Must have valid size, color, and non-negative quantity`,
          });
        }
      }
      const stockSum = stockArray.reduce((sum, item) => sum + item.quantity, 0);
      if (stockSum !== stockTotal) {
        return res.status(400).json({
          success: false,
          message: `Sum of stock quantities (${stockSum}) must equal productStock (${stockTotal})`,
        });
      }
    }

    // Create product
    const product = new Product({
      productName,
      productNumber,
      category: { name: category }, // Store as { name: "Men" }
      productPrice: price,
      productStock: stockTotal,
      productDescription,
      sizes: sizesArray,
      colors: colorsArray,
      stock: stockArray,
      productImage,
    });

    await product.save();
    res.status(201).json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Error adding product:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const productList = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ success: true, products });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let prod;
    if (req.body.ProductData) {
      try {
        prod = JSON.parse(req.body.ProductData);
      } catch (err) {
        return res.json({ success: false, message: "Invalid ProductData JSON format" });
      }
    } else {
      prod = req.body;
    }

    if (!prod || Object.keys(prod).length === 0) {
      return res.json({ success: false, message: 'Product data is required' });
    }

    let updateData = { ...prod };

    if (updateData.productImage) {
      if (!Array.isArray(updateData.productImage) || updateData.productImage.length === 0) {
        return res.status(400).json({ success: false, message: 'productImage must be a non-empty array of URLs' });
      }
      for (const url of updateData.productImage) {
        if (!url.startsWith('https://res.cloudinary.com/')) {
          return res.status(400).json({ success: false, message: 'All image URLs must be valid Cloudinary URLs' });
        }
      }
    }

    if (typeof updateData.sizes === 'string') {
      updateData.sizes = JSON.parse(updateData.sizes);
    }
    if (typeof updateData.colors === 'string') {
      updateData.colors = JSON.parse(updateData.colors);
    }
    if (typeof updateData.stock === 'string') {
      updateData.stock = JSON.parse(updateData.stock);
    }

    if (updateData.stock) {
      const validSizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const validColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'];
      for (const item of updateData.stock) {
        if (
          !item.size || !validSizes.includes(item.size) ||
          !item.color || !validColors.includes(item.color) ||
          typeof item.quantity !== 'number' || item.quantity < 0
        ) {
          return res.status(400).json({ success: false, message: 'Each stock item must have valid size, color, and non-negative quantity' });
        }
      }
      updateData.productStock = updateData.stock.reduce((sum, item) => sum + item.quantity, 0);
      updateData.inStock = updateData.productStock > 0;
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product Deleted' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('reviews.author', 'username');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeStock = async (req, res) => {
  try {
    const { productId, inStock } = req.body;
    if (!productId || typeof inStock !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Product ID and inStock status are required' });
    }
    const product = await Product.findByIdAndUpdate(
      productId,
      { inStock },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Stock status updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, rating } = req.body;
    const userId = req.userId;

    if (!title || !description || !rating || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${[
          !title && 'title',
          !description && 'description',
          !rating && 'rating',
          !userId && 'user authentication'
        ].filter(Boolean).join(', ')}`
      });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ success: false, message: 'Title must be between 3 and 100 characters' });
    }
    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ success: false, message: 'Description must be between 10 and 500 characters' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingReview = product.reviews.find(
      (review) => review.author.toString() === userId
    );
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const newReview = {
      title,
      description,
      rating,
      author: userId,
      date: new Date()
    };
    product.reviews.push(newReview);

    product.totalReviews = product.reviews.length;
    product.ratings = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    await product.save();

    const updatedProduct = await Product.findById(id).populate('reviews.author', 'username');
    return res.json({ success: true, message: 'Review added', product: updatedProduct });
  } catch (error) {
    console.error('Error adding review:', error.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};