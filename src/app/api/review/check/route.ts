import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/app/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import mongoose from 'mongoose'

// Import or define models
import UserModel from '@/app/models/UserModel'
import ReviewModel from '@/app/models/ReviewModel'

export async function GET(request: NextRequest) {
    try {
        // Connect to the database
        await connectDB()
        await Promise.all([
            mongoose.connection.model('User') ?? UserModel,
            mongoose.connection.model('Review') ?? ReviewModel
        ])

        // Get the current logged-in user
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required'
                },
                { status: 401 }
            )
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Product ID is required'
                },
                { status: 400 }
            )
        }

        // Get the user
        const user = await UserModel.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found'
                },
                { status: 404 }
            )
        }

        // Check if the user has already reviewed this product
        const existingReview = await ReviewModel.findOne({
            user_id: user._id,
            product_id: productId
        })

        return NextResponse.json({
            success: true,
            exists: !!existingReview,
            review: existingReview
                ? {
                      _id: existingReview._id,
                      rating: existingReview.rating,
                      title: existingReview.title,
                      comment: existingReview.comment,
                      createdAt: existingReview.createdAt
                  }
                : null
        })
    } catch (error) {
        console.error('Error checking review:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check review status'
            },
            { status: 500 }
        )
    }
}
