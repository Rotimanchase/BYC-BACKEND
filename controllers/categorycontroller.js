import Category from "../models/category.js";

// get all
export const getAll = async(req, res) => {
    try{
        const categories = await Category.find().sort('name')
        return res.json({success: true, categories})
    }catch(error){
        return res.json({ success: false, message: error.message });
    }
}

//create
export const createCategory = async(req, res) => {
    try {
        const { name } = req.body;

        if(!name){
            return res.json({ success: false, message: 'Name is required' })
        }
        const category = await Category.create({name})

        return res.json({success: true, category})
    } 
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

//get single category
export const getSingleCategory = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if(!category){
            return res.json({ success: false, message: 'Category not found' });
        }

        return res.json({success: true, category})
    } 
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

//update category
export const updateCategory = async(req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.json({ success: false, message: 'Name is required' });
        }

        const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true } );

        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }

        return res.json({ success: true, category: category });
    } 
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

//delete
export const deleteCategory = async(req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.json({ success: false, message: 'Category not found' });
        }

        return res.json({ success: true, message: 'Category deleted successfully', category });
    } 
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
}