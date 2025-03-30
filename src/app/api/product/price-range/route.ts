import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import productModel from '@/models/productSchema'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        // Aggregate to find the min and max prices and most common currency
        const priceRange = await productModel.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price.amount' },
                    maxPrice: { $max: '$price.amount' }
                }
            }
        ])

        // Find most common currency
        const currencyResult = await productModel.aggregate([
            {
                $group: {
                    _id: '$price.currency',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            }
        ])

        // Default currency if no products
        const mostCommonCurrency = currencyResult.length > 0 ? currencyResult[0]._id : 'USD'

        // If no products exist, return default range
        if (!priceRange.length) {
            return NextResponse.json({
                success: true,
                data: {
                    minPrice: 0,
                    maxPrice: 1000,
                    currency: mostCommonCurrency
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                minPrice: Math.floor(priceRange[0].minPrice),
                maxPrice: Math.ceil(priceRange[0].maxPrice),
                currency: mostCommonCurrency
            }
        })
    } catch (error) {
        console.error('Error fetching price range:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch price range'
            },
            { status: 500 }
        )
    }
}
