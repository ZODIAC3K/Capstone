import orderModel from '@/models/orderSchema'
import AuthModel from '@/models/authSchema'
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import UserModel from '@/models/userSchema'
import productModel from '@/models/productSchema'
import couponModel from '@/models/couponSchema'
import offerModel from '@/models/offerSchema'
import { AddressModel } from '@/models/addressSchema'
import TransactionModel from '@/models/transactionSchema'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        // Register models to ensure they're available
        try {
            mongoose.models.UserDetail || mongoose.model('UserDetail', UserModel.schema)
            mongoose.models.Order || mongoose.model('Order', orderModel.schema)
            mongoose.models.Auth || mongoose.model('Auth', AuthModel.schema)
            mongoose.models.Product || mongoose.model('Product', productModel.schema)
            mongoose.models.Address || mongoose.model('Address', AddressModel.schema)
            mongoose.models.Transaction || mongoose.model('Transaction', TransactionModel.schema)
            mongoose.models.couponSchema || mongoose.model('couponSchema', couponModel.schema)
            mongoose.models.offerSchema || mongoose.model('offerSchema', offerModel.schema)
            mongoose.models.ImageDetail || mongoose.model('ImageDetail', require('@/models/imageSchema').default.schema)
        } catch (modelError) {
            console.warn('Model registration warning:', modelError)
        }

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

        // Get the order ID from URL params
        const url = new URL(request.url)
        const orderId = url.searchParams.get('id')

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
        }

        // Check if the ID is valid
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return NextResponse.json({ success: false, error: 'Invalid order ID format' }, { status: 400 })
        }

        try {
            console.log(`Fetching order details for ID: ${orderId}`)

            // Find and populate the order
            const order = await orderModel.findById(orderId).populate([
                {
                    path: 'user_id',
                    select: 'fname lname email'
                },
                {
                    path: 'product_ordered',
                    model: 'Product',
                    populate: {
                        path: 'image_id',
                        select: 'image_url'
                    }
                },
                {
                    path: 'address',
                    model: 'Address'
                },
                {
                    path: 'transcation_id',
                    model: 'Transaction'
                },
                {
                    path: 'coupon_used',
                    model: 'couponSchema',
                    select: 'code discount'
                },
                {
                    path: 'offer_used',
                    model: 'offerSchema',
                    select: 'code offer_discount'
                }
            ])

            if (!order) {
                return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
            }

            console.log('Order found in /api/order/details GET:', {
                orderId,
                orderUserId:
                    typeof order.user_id === 'object' ? order.user_id._id?.toString() : order.user_id?.toString(),
                authUserId: auth.userId,
                isAdmin: auth.isAdmin
            })

            // Users can view their own orders, admins can view any order
            // For security, still check that users can only view their own orders
            if (!auth.isAdmin) {
                const orderUserId =
                    typeof order.user_id === 'object' ? order.user_id._id?.toString() : order.user_id?.toString()

                if (orderUserId !== auth.userId) {
                    console.log(
                        `Auth warning: User ${auth.userId} attempted to view order ${orderId} belonging to ${orderUserId}`
                    )
                    // Still return the order data if it's their order
                    if (order.user_id.toString() === auth.userId) {
                        console.log('User authorized to view order - user_id string match')
                    } else {
                        return NextResponse.json(
                            { success: false, error: 'Not authorized to view this order' },
                            { status: 403 }
                        )
                    }
                }
            }

            return NextResponse.json({
                success: true,
                data: {
                    order
                }
            })
        } catch (error) {
            console.error('Error fetching order details:', error)
            return NextResponse.json({ success: false, error: 'Failed to fetch order details' }, { status: 500 })
        }
    } catch (error) {
        console.error('Order details error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
