import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
    user_id: mongoose.Types.ObjectId | string
    product_id: mongoose.Types.ObjectId | string
    order_id?: mongoose.Types.ObjectId | string
    rating: number
    title: string
    comment: string
    helpful_count?: number
    not_helpful_count?: number
    reported?: boolean
    createdAt: Date
    updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        order_id: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            default: null
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        helpful_count: {
            type: Number,
            default: 0
        },
        not_helpful_count: {
            type: Number,
            default: 0
        },
        reported: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

// Create a compound index for user_id and product_id to ensure a user can only review a product once
ReviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true })

// Create an index for product_id to optimize queries for product reviews
ReviewSchema.index({ product_id: 1 })

// Create an index for createdAt to optimize sorting by date
ReviewSchema.index({ createdAt: -1 })

const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)

export default ReviewModel
