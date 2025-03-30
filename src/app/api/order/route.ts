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
import { CreatorModel } from '@/models/creatorSchema'
import TransactionModel from '@/models/transactionSchema'
// create order
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Register models properly
        try {
            // Register models with their actual collection/model names
            mongoose.models.UserDetail || mongoose.model('UserDetail', UserModel.schema)
            mongoose.models.Order || mongoose.model('Order', orderModel.schema)
            mongoose.models.Auth || mongoose.model('Auth', AuthModel.schema)
            mongoose.models.Product || mongoose.model('Product', productModel.schema)
            mongoose.models.couponSchema || mongoose.model('couponSchema', couponModel.schema)
            mongoose.models.offerSchema || mongoose.model('offerSchema', offerModel.schema)
            mongoose.models.Address || mongoose.model('Address', AddressModel.schema)
            mongoose.models.Transaction || mongoose.model('Transaction', TransactionModel.schema)
            mongoose.models.ImageDetail || mongoose.model('ImageDetail', require('@/models/imageSchema').default.schema)
        } catch (modelError) {
            console.warn('Model registration warning:', modelError)
            // Continue even if model registration has issues
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Authentication check
            const accessToken = request.cookies.get('accessToken')?.value
            const refreshToken = request.cookies.get('refreshToken')?.value

            if (!accessToken || !refreshToken) {
                return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
            }

            const auth = await AuthModel.findOne({ accessToken, refreshToken }, null, { session })

            if (!auth) {
                return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
            }

            const {
                product_ordered,
                size_ordered,
                quantity_ordered,
                coupon_used,
                offer_used,
                address_id,
                transcation_id
            } = await request.json()

            if (!transcation_id) {
                await session.abortTransaction()
                session.endSession()
                return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 })
            }
            // Validate required fields
            if (!product_ordered?.length || !size_ordered?.length || !quantity_ordered?.length) {
                await session.abortTransaction()
                session.endSession()
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Product, size, and quantity details are required'
                    },
                    { status: 400 }
                )
            }

            // Validate arrays have same length
            if (product_ordered.length !== size_ordered.length || product_ordered.length !== quantity_ordered.length) {
                await session.abortTransaction()
                session.endSession()
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Product, size, and quantity arrays must have same length'
                    },
                    { status: 400 }
                )
            }

            // Verify all products exist
            for (const productId of product_ordered) {
                const product = await productModel.findById(productId).session(session)
                if (!product) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Product not found: ${productId}`
                        },
                        { status: 404 }
                    )
                }
            }

            // Calculate total amount first
            let total_amount = 0
            for (let i = 0; i < product_ordered.length; i++) {
                const product = await productModel.findById(product_ordered[i]).session(session)
                total_amount += product.price.amount * quantity_ordered[i]
            }

            // Set initial amount_paid equal to total_amount
            let amount_paid = total_amount

            // Verify offer and apply discount only if offer is provided AND all ordered products are in applicable_on
            if (offer_used && offer_used.length > 0) {
                const offerId = offer_used[0] // Get the first offer ID from the array

                const offer = await offerModel.findById(offerId).session(session)
                if (!offer) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Invalid offer' }, { status: 400 })
                }

                // Check if all products in the order are in the offer's applicable_on list
                const allProductsInOffer = product_ordered.every((productId: string) =>
                    offer.applicable_on.includes(productId)
                )

                if (allProductsInOffer) {
                    // Apply offer discount to amount_paid
                    amount_paid = amount_paid - (amount_paid * offer.offer_discount) / 100
                } else {
                    // If not all products are eligible, don't apply offer
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Offer cannot be applied - not all products are eligible'
                        },
                        { status: 400 }
                    )
                }
            }

            // Verify coupon and apply discount to amount_paid
            if (coupon_used && coupon_used.length > 0) {
                const couponId = coupon_used[0] // Get the first coupon ID from the array

                const coupon = await couponModel.findById(couponId).session(session)
                if (!coupon) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Invalid coupon' }, { status: 400 })
                }

                // Check if coupon has expired
                if (new Date() > coupon.end_at) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Coupon has expired' }, { status: 400 })
                }

                // Apply coupon discount to amount_paid
                amount_paid = amount_paid - (amount_paid * coupon.discount) / 100
            }

            // Verify address
            const addressExists = await AddressModel.findById(address_id).session(session)
            if (!addressExists) {
                await session.abortTransaction()
                session.endSession()
                return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 })
            }

            // Create order with both total_amount and amount_paid
            const [order] = await orderModel.create(
                [
                    {
                        user_id: auth.userId,
                        product_ordered,
                        size_ordered,
                        quantity_ordered,
                        coupon_used,
                        offer_used,
                        total_amount, // Original total
                        amount_paid, // Amount after discounts
                        address: address_id,
                        transcation_id,
                        status: 'pending'
                    }
                ],
                { session }
            )

            // Update product sales count and creator total sales
            for (let i = 0; i < product_ordered.length; i++) {
                const product = await productModel.findById(product_ordered[i]).populate('creator_id').session(session)

                // Update product sales count
                await productModel.findByIdAndUpdate(
                    product_ordered[i],
                    { $inc: { sales_count: quantity_ordered[i] } },
                    { session }
                )

                // Update creator total sales
                if (product.creator_id) {
                    const saleAmount = product.price.amount * quantity_ordered[i]
                    await CreatorModel.findByIdAndUpdate(
                        product.creator_id,
                        { $inc: { totalSales: saleAmount } },
                        { session }
                    )
                }
            }

            // Populate order details
            const populatedOrder = await orderModel
                .findById(order._id)
                .session(session)
                .populate([
                    {
                        path: 'product_ordered',
                        model: 'Product',
                        populate: {
                            path: 'creator_id',
                            model: 'Creator'
                        }
                    },
                    {
                        path: 'address',
                        model: 'Address'
                    },
                    {
                        path: 'coupon_used',
                        model: 'couponSchema'
                    },
                    {
                        path: 'offer_used',
                        model: 'offerSchema'
                    }
                ])

            await session.commitTransaction()
            session.endSession()

            return NextResponse.json(
                {
                    success: true,
                    message: 'Order created successfully',
                    data: populatedOrder
                },
                { status: 201 }
            )
        } catch (error) {
            await session.abortTransaction()
            throw error
        } finally {
            session.endSession()
        }
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create order'
            },
            { status: 500 }
        )
    }
}

// === Example Request ===
// {
// 	"product_ordered": ["67e34283d001c2fc0ec7110d"],
// 	"size_ordered": ["M"],
// 	"quantity_ordered": [1],
// 	"coupon_used": ["67e34283d001c2fc0ec7110d"],
// 	"offer_used": ["67e34283d001c2fc0ec7110d"],
// 	"transcation_id": "67e34283d001c2fc0ec7110d",
// }

// get all orders
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

        // Check if an order ID is provided in the URL params
        const url = new URL(request.url)
        const orderId = url.searchParams.get('id')

        // Pagination parameters
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // If order ID is provided, return that specific order
        if (orderId) {
            console.log(`Fetching order details for ID: ${orderId}`)

            // Check if the ID is valid
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return NextResponse.json({ success: false, error: 'Invalid order ID format' }, { status: 400 })
            }

            try {
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

                console.log('Order found in /api/order GET:', {
                    orderId,
                    orderUserId:
                        typeof order.user_id === 'object' ? order.user_id._id?.toString() : order.user_id?.toString(),
                    authUserId: auth.userId,
                    authUserIdType: typeof auth.userId,
                    isAdmin: auth.isAdmin
                })

                // Just print the raw user IDs to debug string comparison
                console.log('Raw IDs:', {
                    orderUserIdRaw: order.user_id,
                    authUserIdRaw: auth.userId
                })

                // Authorization check - users can view their own orders
                // Both values must be converted to string for proper comparison
                const orderUserId =
                    typeof order.user_id === 'object' ? order.user_id._id?.toString() : order.user_id?.toString()

                const authUserId = auth.userId.toString()

                // Skip admin check - users should be able to view their own orders
                if (orderUserId !== authUserId) {
                    console.log(`Auth check failed: ${orderUserId} !== ${authUserId}`)

                    // Final check with direct toString on order.user_id (catches some edge cases)
                    const rawOrderUserId = order.user_id.toString()
                    if (rawOrderUserId !== authUserId) {
                        console.log(`Auth failed with raw comparison: ${rawOrderUserId} !== ${authUserId}`)
                        return NextResponse.json(
                            { success: false, error: 'Not authorized to view this order' },
                            { status: 403 }
                        )
                    } else {
                        console.log('Auth passed with toString() method')
                    }
                } else {
                    console.log('Auth passed by exact string match')
                }

                return NextResponse.json({
                    success: true,
                    data: {
                        order
                    }
                })
            } catch (error) {
                console.error('Error fetching individual order:', error)
                return NextResponse.json({ success: false, error: 'Failed to fetch order details' }, { status: 500 })
            }
        }

        // If no ID is provided, return all orders for the user (or all orders for admin)
        try {
            // Build query - admins can see all orders, regular users only see their own
            const query = auth.isAdmin ? {} : { user_id: auth.userId }

            // Count total orders for pagination
            const total = await orderModel.countDocuments(query)

            // Fetch orders with pagination
            const orders = await orderModel
                .find(query)
                .populate([
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
                    }
                ])
                .sort({ createdAt: -1 }) // newest first
                .skip(skip)
                .limit(limit)

            // Calculate pagination info
            const totalPages = Math.ceil(total / limit)

            return NextResponse.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: totalPages
                    }
                }
            })
        } catch (error) {
            console.error('Error fetching orders:', error)
            return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
        }
    } catch (error) {
        console.error('Order GET error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// === Example Endpoint ===
// Request to get order by id
// method: GET
// url: http://localhost:3000/api/order?id=67e34283d001c2fc0ec7110d
// {
// 	"id": "67e34283d001c2fc0ec7110d",
// }

// Request to get all orders
// method: GET
// url: http://localhost:3000/api/order
// {
// 	"id": "67e34283d001c2fc0ec7110d",
// }

// Request to with pagination
// method: GET
// url: http://localhost:3000/api/order?page=1&limit=10&status=pending
// {
// 	"page": 1,
// 	"limit": 10,
// 	"status": "pending",
// }

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect()

        // Register models
        try {
            mongoose.models.UserDetail || mongoose.model('UserDetail', UserModel.schema)
            mongoose.models.Order || mongoose.model('Order', orderModel.schema)
            mongoose.models.Auth || mongoose.model('Auth', AuthModel.schema)
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

        // Admin check - only admins can delete orders
        if (!auth.isAdmin) {
            return NextResponse.json({ success: false, error: 'Only admins can delete orders' }, { status: 403 })
        }

        const url = new URL(request.url)
        const id = url.searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
        }

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid order ID format' }, { status: 400 })
        }

        // Find the order to check if it exists
        const order = await orderModel.findById(id)

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        // Create a session to handle transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Delete the order
            await orderModel.findByIdAndDelete(id).session(session)

            // If there's a successful transaction, don't delete it to maintain financial records
            // But you might want to mark the transaction somehow

            await session.commitTransaction()
            session.endSession()

            return NextResponse.json({
                success: true,
                message: 'Order deleted successfully'
            })
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    } catch (error) {
        console.error('Order deletion error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete order' }, { status: 500 })
    }
}

// === Example Endpoint ===
// Request to delete order
// method: DELETE
// url: http://localhost:3000/api/order?id=67e34283d001c2fc0ec7110d
// {
// 	"id": "67e34283d001c2fc0ec7110d",
// }

// Request to delete order with invalid order id
// method: DELETE
// url: http://localhost:3000/api/order?id=67e34283d001c2fc0ec7110d
// {
// 	"id": "67e34283d001c2fc0ec7110d",
// }

// Update order details
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect()

        // Register models
        try {
            mongoose.models.UserDetail || mongoose.model('UserDetail', UserModel.schema)
            mongoose.models.Order || mongoose.model('Order', orderModel.schema)
            mongoose.models.Auth || mongoose.model('Auth', AuthModel.schema)
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

        // Get request body
        const { id, status, tracking_info } = await request.json()

        if (!id) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
        }

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'Invalid order ID format' }, { status: 400 })
        }

        // Find the order
        const order = await orderModel.findById(id)

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
        }

        // Authorization check - only allow admins to update orders
        // Or users to update their own orders in specific limited cases
        if (!auth.isAdmin) {
            // Handle all possible representations of user_id
            const orderUserId =
                typeof order.user_id === 'object' ? order.user_id._id?.toString() : order.user_id?.toString()

            // Check if user is authorized to modify this order
            if (orderUserId !== auth.userId && order.user_id.toString() !== auth.userId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Not authorized to update this order'
                    },
                    { status: 403 }
                )
            }

            // Only allow users to cancel their orders when they're in pending or processing state
            if (status && status !== 'cancelled') {
                return NextResponse.json({ success: false, error: 'Users can only cancel orders' }, { status: 403 })
            }

            if (status === 'cancelled' && !['pending', 'processing'].includes(order.status)) {
                return NextResponse.json(
                    { success: false, error: 'Orders can only be cancelled when pending or processing' },
                    { status: 400 }
                )
            }
        }

        // Create update object
        const updateData: any = {}

        // Only update fields that are provided
        if (status) updateData.status = status
        if (tracking_info) updateData.tracking_info = tracking_info

        // Apply updates
        const updatedOrder = await orderModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate([
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

        // Handle transaction status update for cancellations
        if (status === 'cancelled' && updatedOrder.transcation_id) {
            try {
                // Get transaction ID - handle both object and string formats
                const transactionId =
                    typeof updatedOrder.transcation_id === 'object'
                        ? updatedOrder.transcation_id._id
                        : updatedOrder.transcation_id

                await TransactionModel.findByIdAndUpdate(transactionId, { $set: { status: 'failed' } })
            } catch (err) {
                console.error('Error updating transaction for cancelled order:', err)
                // Continue even if transaction update fails - we've already updated the order
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                order: updatedOrder
            }
        })
    } catch (error) {
        console.error('Order update error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
    }
}
