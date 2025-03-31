import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
    {
        category_name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        image_url: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)

const CategoryModel = mongoose.models.categoryschema || mongoose.model('categoryschema', categorySchema)

export default CategoryModel
