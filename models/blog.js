import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    blogImage: {
        type: String,
        required: true,
    },
    blogTitle: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
    },
    blogDescription: {
        type: String,
        minlength: 5,
    },
    authorImage: {
        type: String,
        required: true,
    },
    authorName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
    },
    authorTitle: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
    },
    blogLikes: {
        type: Number,
        default: 0,
        min: 0,
    },
    blogViews: {
        type: Number,
        default: 0,
        min: 0,
    }
}, { timestamps: true });

const Blog = mongoose.model('blog', blogSchema);

export default Blog;
