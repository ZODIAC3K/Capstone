import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import CartModel, { CartItem } from '@/models/cartSchema'
import AuthModel from '@/models/authSchema'
import productModel from '@/models/productSchema'
import { CreatorModel } from '@/models/creatorSchema'
import { ImageModel } from '@/models/imageSchema'
import mongoose from 'mongoose'

// GET cart items for the current user
export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        // Ensure all models are registered
        await Promise.all([
            CartModel.findOne().exec(),
            AuthModel.findOne().exec(),
            productModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ImageModel.findOne().exec()
        ]).catch(() => {
            console.log('Model registration initialized')
        })

        // Authentication check
        const accessToken = request.cookies.get('accessToken')?.value
        const refreshToken = request.cookies.get('refreshToken')?.value

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
        }

        // Find user
        const findUser = await AuthModel.findOne({ accessToken, refreshToken })

        if (!findUser) {
            return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
        }

        const userId = findUser.userId

        // Find cart for this user and populate product details
        const cart = await CartModel.findOne({ user_id: userId }).populate({
            path: 'items.product_id',
            model: 'Product',
            populate: [
                { path: 'creator_id', model: 'Creator' },
                { path: 'image_id', model: 'ImageDetail' }
            ]
        })

        if (!cart) {
            // If no cart found, return empty cart
            return NextResponse.json(
                {
                    success: true,
                    data: {
                        _id: 'empty-cart',
                        items: [],
                        total: 0,
                        currency: 'INR'
                    }
                },
                { status: 200 }
            )
        }

        // Calculate total price
        let total = 0
        if (cart.items && cart.items.length > 0) {
            total = cart.items.reduce((sum: number, item: any) => {
                const product = item.product_id as any
                return sum + (product.price?.amount || 0) * item.quantity
            }, 0)
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    _id: cart._id,
                    items: cart.items,
                    total: total,
                    currency: cart.items.length > 0 ? (cart.items[0].product_id as any).price?.currency || 'INR' : 'INR'
                }
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch cart'
            },
            { status: 500 }
        )
    }
}

// Add item to cart
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Ensure all models are registered
        await Promise.all([
            CartModel.findOne().exec(),
            AuthModel.findOne().exec(),
            productModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ImageModel.findOne().exec()
        ]).catch(() => {
            console.log('Model registration initialized')
        })

        // Authentication check
        const accessToken = request.cookies.get('accessToken')?.value
        const refreshToken = request.cookies.get('refreshToken')?.value

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
        }

        // Find user
        const findUser = await AuthModel.findOne({ accessToken, refreshToken })

        if (!findUser) {
            return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
        }

        const userId = findUser.userId

        // Get request body
        const { product_id, quantity = 1 } = await request.json()

        // Validate productId
        if (!product_id) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
        }

        // Check if product exists
        const product = await productModel.findById(product_id)
        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
        }

        // Start session for transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Find or create cart for this user
            let cart = await CartModel.findOne({ user_id: userId }).session(session)

            if (!cart) {
                // Create new cart if it doesn't exist
                cart = await CartModel.create(
                    [
                        {
                            user_id: userId,
                            items: []
                        }
                    ],
                    { session }
                )
                cart = cart[0] // MongoDB returns an array when using create with session
            }

            // Check if product already exists in cart
            const existingItemIndex = cart.items.findIndex(
                (item: CartItem) => item.product_id.toString() === product_id
            )

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                cart.items[existingItemIndex].quantity += quantity
            } else {
                // Add new item to cart
                cart.items.push({
                    product_id: new mongoose.Types.ObjectId(product_id),
                    quantity
                })
            }

            // Save cart
            await cart.save({ session })
            await session.commitTransaction()
            session.endSession()

            return NextResponse.json(
                {
                    success: true,
                    message: 'Item added to cart',
                    data: { cartId: cart._id }
                },
                { status: 201 }
            )
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    } catch (error) {
        console.error('Error adding item to cart:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add item to cart'
            },
            { status: 500 }
        )
    }
}

// Update cart item quantity or remove if quantity is 0
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect()

        // Ensure all models are registered
        await Promise.all([
            CartModel.findOne().exec(),
            AuthModel.findOne().exec(),
            productModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ImageModel.findOne().exec()
        ]).catch(() => {
            console.log('Model registration initialized')
        })

        // Authentication check
        const accessToken = request.cookies.get('accessToken')?.value
        const refreshToken = request.cookies.get('refreshToken')?.value

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
        }

        // Find user
        const findUser = await AuthModel.findOne({ accessToken, refreshToken })

        if (!findUser) {
            return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
        }

        const userId = findUser.userId

        // Get request body
        const { product_id, quantity } = await request.json()

        // Validate inputs
        if (!product_id) {
            return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
        }

        if (quantity === undefined || quantity === null) {
            return NextResponse.json({ success: false, error: 'Quantity is required' }, { status: 400 })
        }

        // Start session for transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Find cart for this user
            const cart = await CartModel.findOne({ user_id: userId }).session(session)

            if (!cart) {
                await session.abortTransaction()
                session.endSession()
                return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 })
            }

            if (quantity <= 0) {
                // Remove item from cart if quantity is 0 or negative
                cart.items = cart.items.filter((item: CartItem) => item.product_id.toString() !== product_id)
            } else {
                // Update quantity
                const itemIndex = cart.items.findIndex((item: CartItem) => item.product_id.toString() === product_id)

                if (itemIndex === -1) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Item not found in cart' }, { status: 404 })
                }

                cart.items[itemIndex].quantity = quantity
            }

            await cart.save({ session })
            await session.commitTransaction()
            session.endSession()

            return NextResponse.json(
                {
                    success: true,
                    message: quantity <= 0 ? 'Item removed from cart' : 'Cart updated',
                    data: { cartId: cart._id }
                },
                { status: 200 }
            )
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    } catch (error) {
        console.error('Error updating cart:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update cart'
            },
            { status: 500 }
        )
    }
}

// Delete entire cart or specific item
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect()

        // Ensure all models are registered
        await Promise.all([
            CartModel.findOne().exec(),
            AuthModel.findOne().exec(),
            productModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ImageModel.findOne().exec()
        ]).catch(() => {
            console.log('Model registration initialized')
        })

        // Authentication check
        const accessToken = request.cookies.get('accessToken')?.value
        const refreshToken = request.cookies.get('refreshToken')?.value

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ success: false, error: 'No access token provided' }, { status: 401 })
        }

        // Find user
        const findUser = await AuthModel.findOne({ accessToken, refreshToken })

        if (!findUser) {
            return NextResponse.json({ success: false, error: 'Invalid access token' }, { status: 401 })
        }

        const userId = findUser.userId

        // Parse URL to get product_id if present
        const url = new URL(request.url)
        const product_id = url.searchParams.get('productId')

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            if (product_id) {
                // Delete specific item from cart
                const result = await CartModel.updateOne(
                    { user_id: userId },
                    { $pull: { items: { product_id: new mongoose.Types.ObjectId(product_id) } } },
                    { session }
                )

                if (result.matchedCount === 0) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 })
                }

                await session.commitTransaction()
                session.endSession()

                return NextResponse.json(
                    {
                        success: true,
                        message: 'Item removed from cart'
                    },
                    { status: 200 }
                )
            } else {
                // Delete all items (empty the cart)
                const result = await CartModel.updateOne({ user_id: userId }, { $set: { items: [] } }, { session })

                if (result.matchedCount === 0) {
                    await session.abortTransaction()
                    session.endSession()
                    return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 })
                }

                await session.commitTransaction()
                session.endSession()

                return NextResponse.json(
                    {
                        success: true,
                        message: 'Cart emptied'
                    },
                    { status: 200 }
                )
            }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            throw error
        }
    } catch (error) {
        console.error('Error deleting cart items:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete cart items'
            },
            { status: 500 }
        )
    }
}
