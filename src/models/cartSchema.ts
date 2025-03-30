import mongoose, { Schema, Document } from 'mongoose'

export interface CartItem {
    product_id: mongoose.Types.ObjectId
    quantity: number
}

export interface CartDocument extends Document {
    user_id: mongoose.Types.ObjectId
    items: CartItem[]
    createdAt: Date
    updatedAt: Date
}

const CartItemSchema = new Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'productSchema',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
})

const CartSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'UserDetail',
            required: true
        },
        items: [CartItemSchema]
    },
    { timestamps: true }
)

// Create a compound index to ensure user_id is unique
CartSchema.index({ user_id: 1 }, { unique: true })

const CartModel = mongoose.models.Cart || mongoose.model<CartDocument>('Cart', CartSchema)

export default CartModel 