import mongoose from "mongoose";

export const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        // enum: ['MEN', 'FEMALE', 'CHILDREN'],
        maxlength: 50
    }
})

const Category = mongoose.model('category', categorySchema)
export default Category;
