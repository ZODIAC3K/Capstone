import { Schema, model, models } from 'mongoose'

const transactionSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'UserDetail', required: true },
    order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
    razorpay_payment_id: { type: String },
    razorpay_order_id: { type: String },
    razorpay_signature: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const Transaction = models.Transaction || model('Transaction', transactionSchema)

export default Transaction
