import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import AuthModel from '@/models/authSchema'
import orderModel from '@/models/orderSchema'
import TransactionModel from '@/models/transactionSchema'

// POST: Process a refund request
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Authentication check
        const accessToken = request.cookies.get('accessToken')?.value
        const refreshToken = request.cookies.get('refreshToken')?.value

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
        }

        const auth = await AuthModel.findOne({ accessToken, refreshToken })

        if (!auth) {
            return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
        }

        // Parse request data
        const { order_id, reason } = await request.json()

        if (!order_id || !reason) {
            return NextResponse.json({ success: false, error: 'Order ID and reason are required' }, { status: 400 })
        }

        // Verify order exists and belongs to user
        const order = await orderModel.findById(order_id)
        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        // Verify order belongs to the user
        if (order.user_id.toString() !== auth.userId.toString()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'You are not authorized to refund this order'
                },
                { status: 403 }
            )
        }

        // Check if order is eligible for refund (delivered and not already refunded)
        if (order.status !== 'delivered') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Only delivered orders can be refunded'
                },
                { status: 400 }
            )
        }

        // Start a transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Update order status to refunded
            const updatedOrder = await orderModel.findByIdAndUpdate(
                order_id,
                { status: 'refunded' },
                { new: true, session }
            )

            // Create a dummy refund transaction
            let refundTransaction = null

            // If there was a transaction, create a refund transaction
            if (order.transaction_id) {
                const originalTransaction = await TransactionModel.findById(order.transaction_id).session(session)

                if (originalTransaction) {
                    // Create a dummy refund transaction
                    refundTransaction = await TransactionModel.create(
                        [
                            {
                                amount: originalTransaction.amount,
                                currency: originalTransaction.currency || 'INR',
                                status: 'successful', // Dummy status, no actual money moved
                                payment_method: 'refund',
                                description: `Refund for order ${order_id}: ${reason}`,
                                razorpay_payment_id: `dummy_refund_${Date.now()}`,
                                razorpay_order_id: originalTransaction.razorpay_order_id,
                                user_id: auth.userId
                            }
                        ],
                        { session }
                    )
                }
            }

            // Log the refund request
            console.log(`Processed refund for order ${order_id}`, {
                userId: auth.userId,
                reason,
                timestamp: new Date(),
                refundTransactionId: refundTransaction ? refundTransaction[0]._id : null
            })

            await session.commitTransaction()

            return NextResponse.json(
                {
                    success: true,
                    message: 'Refund processed successfully',
                    data: {
                        order: updatedOrder,
                        refundTransaction: refundTransaction ? refundTransaction[0] : null
                    }
                },
                { status: 200 }
            )
        } catch (error) {
            await session.abortTransaction()
            throw error
        } finally {
            session.endSession()
        }
    } catch (error) {
        console.error('Error processing refund:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process refund'
            },
            { status: 500 }
        )
    }
}
