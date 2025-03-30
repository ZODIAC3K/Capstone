import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import ReviewModel from '@/models/reviewSchema'
import OrderModel from '@/models/orderSchema'
import productModel from '@/models/productSchema'
import { getUserFromToken } from '@/utils/auth'

// GET: Check if a user can review a product
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        await Promise.all([
            ReviewModel.findOne().exec(),
            productModel.findOne().exec(),
            mongoose.connection.model('Order') ?? OrderModel
        ]).catch(() => {})

        // Get user from token - properly await the async function
        const user = await getUserFromToken(request)
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    canReview: false,
                    error: 'User not authenticated'
                },
                { status: 401 }
            )
        }

        // Get product ID from query params
        const searchParams = request.nextUrl.searchParams
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json(
                {
                    success: false,
                    canReview: false,
                    error: 'Product ID is required'
                },
                { status: 400 }
            )
        }

        // Check if product exists
        const product = await productModel.findById(productId)
        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    canReview: false,
                    error: 'Product not found'
                },
                { status: 404 }
            )
        }

        // Check if user has already reviewed this product
        const existingReview = await ReviewModel.findOne({
            user_id: user._id,
            product_id: productId
        })

        if (existingReview) {
            return NextResponse.json(
                {
                    success: true,
                    canReview: false,
                    reason: 'already_reviewed'
                },
                { status: 200 }
            )
        }

        // Check if user has purchased this product (has a delivered order with this product)
        const userOrders = await OrderModel.find({
            user_id: user._id,
            status: 'delivered'
        })

        let hasPurchased = false

        for (const order of userOrders) {
            const productInOrder = order.product_ordered.some((item: any) => {
                const itemProductId =
                    typeof item === 'object' && item.product_id
                        ? typeof item.product_id === 'object'
                            ? item.product_id._id.toString()
                            : item.product_id.toString()
                        : item.toString()

                return itemProductId === productId
            })

            if (productInOrder) {
                hasPurchased = true
                break
            }
        }

        // For demonstration purposes, we'll allow anyone to review
        // In a real application, you might want to uncomment the below code to enforce purchase verification
        // if (!hasPurchased) {
        //     return NextResponse.json(
        //         {
        //             success: true,
        //             canReview: false,
        //             reason: 'not_purchased'
        //         },
        //         { status: 200 }
        //     )
        // }

        // User can review
        return NextResponse.json(
            {
                success: true,
                canReview: true
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error checking if user can review:', error)
        return NextResponse.json(
            {
                success: false,
                canReview: false,
                error: 'Failed to check review eligibility'
            },
            { status: 500 }
        )
    }
}
