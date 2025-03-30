import { NextRequest, NextResponse } from 'next/server'
import productModel from '@/models/productSchema'
import { ImageModel } from '@/models/imageSchema'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import AuthModel from '@/models/authSchema'
import { CreatorModel } from '@/models/creatorSchema'
import ShaderModel from '@/models/shaderSchema'
import UserModel from '@/models/userSchema'
import CategoryModel from '@/models/categorySchema'
import objectModel from '@/models/objectSchema'
import { uploadObjectToS3 } from '@/utils/uploadObjectS3'

export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Pre-register all required models
        await Promise.all([
            UserModel.findOne().exec(),
            ImageModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ShaderModel.findOne().exec(),
            CategoryModel.findOne().exec(),
            productModel.findOne().exec(),
            objectModel.findOne().exec()
        ]).catch(() => {})

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Authentication check
            const accessToken = request.cookies.get('accessToken')?.value
            const refreshToken = request.cookies.get('refreshToken')?.value

            if (!accessToken || !refreshToken) {
                return NextResponse.json({ error: 'No access token provided' }, { status: 401 })
            }

            // Find user within transaction
            const findUser = await AuthModel.findOne({ accessToken, refreshToken }, null, { session })

            if (!findUser) {
                return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
            }

            // Find creator within transaction
            const findCreator = await CreatorModel.findOne({ userId: findUser.userId }, null, { session })

            if (!findCreator) {
                return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
            }

            const creator_id = findCreator._id

            const formData = await request.formData()

            // Get all form fields
            const title = formData.get('title') as string
            const description = formData.get('description') as string
            const category_id = formData.get('category_id') as string
            const model_id = formData.get('model_id') as string
            const shader = formData.get('shader') as File
            const price_amount = Number(formData.get('price_amount'))
            const price_currency = formData.get('price_currency') as string
            const image = formData.get('image') as File
            const shaderType = formData.get('shaderType') as string

            // Validate required fields
            if (!title || !model_id || !shader || !price_amount || !image) {
                console.log('Missing fields check:')
                console.log('title:', !!title)
                console.log('model_id:', !!model_id)
                console.log('shader:', !!shader)
                console.log('price_amount:', !!price_amount)
                console.log('image:', !!image)

                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Missing required fields',
                        missing: {
                            title: !title,
                            model_id: !model_id,
                            shader: !shader,
                            price_amount: !price_amount,
                            image: !image
                        }
                    },
                    { status: 400 }
                )
            }

            const unique_product = await productModel.findOne({ title })
            if (unique_product) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Product already exists with this title'
                    },
                    { status: 400 }
                )
            }

            // Upload product image to S3 instead of storing in MongoDB
            const imageBuffer = Buffer.from(await image.arrayBuffer())
            // Create a unique filename for S3
            const imageFileName = `product-image-${creator_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`

            const imageUploadResult = await uploadObjectToS3(imageBuffer, imageFileName, image.type || 'image/jpeg')

            if (!imageUploadResult.success) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: imageUploadResult.error || 'Failed to upload product image'
                    },
                    { status: 500 }
                )
            }

            // Create image document with URL
            const [imageDetail] = await ImageModel.create(
                [
                    {
                        user_id: creator_id,
                        image_url: imageUploadResult.url,
                        content_type: image.type || 'image/jpeg'
                    }
                ],
                { session }
            )

            // Upload shader image to S3
            const shaderImageBuffer = Buffer.from(await shader.arrayBuffer())
            const shaderFileName = `shader-image-${creator_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`

            const shaderUploadResult = await uploadObjectToS3(
                shaderImageBuffer,
                shaderFileName,
                shader.type || 'image/jpeg'
            )

            if (!shaderUploadResult.success) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: shaderUploadResult.error || 'Failed to upload shader image'
                    },
                    { status: 500 }
                )
            }

            // Create shader image document with URL
            const [shaderImageDetail] = await ImageModel.create(
                [
                    {
                        user_id: creator_id,
                        image_url: shaderUploadResult.url,
                        content_type: shader.type || 'image/jpeg'
                    }
                ],
                { session }
            )

            // Create product first (without shader reference)
            const [product] = await productModel.create(
                [
                    {
                        title,
                        description,
                        category_id: category_id ? category_id.split(',') : [],
                        model_id,
                        creator_id,
                        price: {
                            amount: price_amount,
                            currency: price_currency || 'INR'
                        },
                        image_id: imageDetail._id
                    }
                ],
                { session }
            )

            // Now create shader with product reference
            const [shaderDetail] = await ShaderModel.create(
                [
                    {
                        user_id: creator_id,
                        shaderImage: shaderImageDetail._id,
                        shaderType: shaderType,
                        product_id: product._id
                    }
                ],
                { session }
            )

            // Update product with shader reference
            await productModel.findByIdAndUpdate(product._id, { shader_id: shaderDetail._id }, { session })

            // Update creator products array
            const creator = await CreatorModel.findById(creator_id)
            creator?.products.push(product._id)
            await creator?.save({ session })

            // Populate all references within transaction
            const populatedProduct = await productModel
                .findById(product._id)
                .session(session)
                .populate([
                    {
                        path: 'category_id',
                        model: 'categoryschema'
                    },
                    { path: 'model_id', model: 'Object' },
                    { path: 'creator_id', model: 'Creator' },
                    {
                        path: 'shader_id',
                        model: 'shaderSchema',
                        populate: {
                            path: 'shaderImage',
                            model: 'ImageDetail'
                        }
                    },
                    { path: 'image_id', model: 'ImageDetail' }
                ])

            // Commit the transaction
            await session.commitTransaction()
            session.endSession()

            return Response.json(
                {
                    success: true,
                    message: 'Product created successfully',
                    data: populatedProduct
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
        console.error('Error creating product:', error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            { status: 500 }
        )
    }
}

// === Example FormData ===
// Request at: http://localhost:3000/api/product
// Method: POST
// Headers:
// - Cookie: accessToken=xxx; refreshToken=yyy

// FormData:
// - title: "Cool T-Shirt EEDFEF"
// - description: "Awesome T-Shirt"
// - category_id: "67e2c2efa9e1238a162f5a3c"
// - model_id: "67e34283d001c2fc0ec7110c"
// - shader: (file) 366278.jpg
// - price_amount: "999"
// - price_currency: "INR"
// - image: (file) ai_faishon.jpg
// - shaderType: "partial-body"

// Success Response (201):
// {
//     "success": true,
//     "message": "Product created successfully",
//     "data": {
//         "_id": "67e34283d001c2fc0ec7110d",
//         "title": "Cool T-Shirt EEDFEF",
//         "description": "Awesome T-Shirt",
//         "category_id": [{
//             "_id": "67e2c2efa9e1238a162f5a3c",
//             "category_name": "T-Shirts"
//         }],
//         "model_id": {
//             "_id": "67e34283d001c2fc0ec7110c",
//             "name": "T-Shirt Model",
//             "modelUrl": "https://zodiac3k-bucket.s3.amazonaws.com/models/t-shirt.glb",
//             "position": { "x": 0, "y": 0, "z": 0 },
//             "rotation": { "x": 0, "y": 0, "z": 0 },
//             "scale": { "x": 1, "y": 1, "z": 1 }
//         },
//         "creator_id": {
//             "_id": "67e34283d001c2fc0ec7110e",
//             "userId": "67e34283d001c2fc0ec7110f",
//             "name": "Creator Name",
//             "bio": "Creative designer",
//             "quote": "Design is life",
//             "royaltyPercentage": 30
//         },
//         "shader_id": {
//             "_id": "67e34283d001c2fc0ec71111",
//             "shaderType": "partial-body",
//             "shaderImage": "67e34283d001c2fc0ec71112",
//             "product_id": "67e34283d001c2fc0ec7110d",
//             "mapping": {
//                 "scale": { "x": 1, "y": 1 },
//                 "offset": { "x": 0, "y": 0 },
//                 "rotation": 0
//             }
//         },
//         "price": {
//             "amount": 999,
//             "currency": "INR"
//         },
//         "image_id": {
//             "_id": "67e34283d001c2fc0ec71113",
//             "user_id": "67e34283d001c2fc0ec7110e",
//             "content_type": "image/jpeg",
//             "data": "<Buffer ...>"
//         },
//         "sales_count": 0,
//         "created_at": "2024-03-12T10:00:00.000Z",
//         "updated_at": "2024-03-12T10:00:00.000Z"
//     }
// }

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        // Pre-register all required models
        await Promise.all([
            productModel.findOne().exec(),
            objectModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ShaderModel.findOne().exec(),
            CategoryModel.findOne().exec(),
            ImageModel.findOne().exec(),
            UserModel.findOne().exec()
        ]).catch(() => {})

        // Parse query parameters
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        const category = url.searchParams.get('category')
        const creator = url.searchParams.get('creator')
        const title = url.searchParams.get('title')
        const minPrice = url.searchParams.get('minPrice')
        const maxPrice = url.searchParams.get('maxPrice')
        const sortBy = url.searchParams.get('sortBy') || 'createdAt'
        const sortOrder = url.searchParams.get('sortOrder') || 'desc'
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Build filter query
        const filter: any = {}
        if (id) filter._id = id
        if (category) filter.category_id = { $in: [category] }
        if (creator) filter.creator_id = creator
        if (title) filter.title = { $regex: title, $options: 'i' }

        // Handle price range filtering
        if (minPrice || maxPrice) {
            filter.price = {}
            if (minPrice) filter.price.amount = { $gte: parseFloat(minPrice) }
            if (maxPrice) {
                if (filter.price.amount) {
                    filter.price.amount.$lte = parseFloat(maxPrice)
                } else {
                    filter.price.amount = { $lte: parseFloat(maxPrice) }
                }
            }
        }

        // Build sort options
        const sort: any = {}
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1

        // If we're looking for a specific product by ID
        if (id) {
            const product = await productModel.findById(id).populate([
                {
                    path: 'category_id',
                    model: 'categoryschema'
                },
                {
                    path: 'model_id',
                    model: 'Object'
                },
                {
                    path: 'creator_id',
                    model: 'Creator',
                    populate: {
                        path: 'userId',
                        populate: {
                            path: 'profile_picture',
                            model: 'ImageDetail'
                        }
                    }
                },
                {
                    path: 'shader_id',
                    model: 'shaderSchema',
                    populate: {
                        path: 'shaderImage',
                        model: 'ImageDetail'
                    }
                },
                { path: 'image_id', model: 'ImageDetail' }
            ])

            if (!product) {
                return Response.json(
                    {
                        success: false,
                        error: 'Product not found'
                    },
                    { status: 404 }
                )
            }

            return Response.json(
                {
                    success: true,
                    data: product
                },
                { status: 200 }
            )
        }

        // Get total count for pagination
        const totalProducts = await productModel.countDocuments(filter)

        // Get products with pagination
        const products = await productModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate([
                {
                    path: 'category_id',
                    model: 'categoryschema'
                },
                {
                    path: 'model_id',
                    model: 'Object'
                },
                {
                    path: 'creator_id',
                    model: 'Creator',
                    populate: {
                        path: 'userId',
                        model: 'UserDetail',
                        populate: {
                            path: 'profile_picture',
                            model: 'ImageDetail'
                        }
                    }
                },
                {
                    path: 'shader_id',
                    model: 'shaderSchema',
                    populate: {
                        path: 'shaderImage',
                        model: 'ImageDetail'
                    }
                },
                { path: 'image_id', model: 'ImageDetail' }
            ])

        return Response.json(
            {
                success: true,
                data: products,
                pagination: {
                    totalProducts,
                    totalPages: Math.ceil(totalProducts / limit),
                    currentPage: page,
                    limit
                }
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching products:', error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            { status: 500 }
        )
    }
}

// === Example Requests and Responses ===

// 1. Get Single Product
// GET http://localhost:3000/api/product?id=66f091a9b511458168a109ca

// Success Response (200):
// {
//     "success": true,
//     "data": {
//         "_id": "66f091a9b511458168a109ca",
//         "title": "Cool T-Shirt EEDFEF",
//         "description": "Awesome T-Shirt",
//         "category_id": [{
//             "_id": "67e2c2efa9e1238a162f5a3c",
//             "category_name": "T-Shirts"
//         }],
//         "model_id": {
//             "_id": "67e34283d001c2fc0ec7110c",
//             "name": "T-Shirt Model",
//             "modelUrl": "https://zodiac3k-bucket.s3.amazonaws.com/models/t-shirt.glb",
//             "position": { "x": 0, "y": 0, "z": 0 },
//             "rotation": { "x": 0, "y": 0, "z": 0 },
//             "scale": { "x": 1, "y": 1, "z": 1 }
//         },
//         "creator_id": {
//             "_id": "67e34283d001c2fc0ec7110d",
//             "name": "Creator Name",
//             "bio": "Creative designer",
//             "quote": "Design is life"
//         },
//         "shader_id": {
//             "_id": "67e34283d001c2fc0ec7110e",
//             "shaderType": "partial-body",
//             "shaderImage": "67e34283d001c2fc0ec7110f",
//             "product_id": "66f091a9b511458168a109ca"
//         },
//         "image_id": {
//             "_id": "67e34283d001c2fc0ec71110",
//             "user_id": "67e34283d001c2fc0ec71111",
//             "content_type": "image/jpeg",
//             "data": "<Buffer ...>"
//         },
//         "price": {
//             "amount": 999,
//             "currency": "INR"
//         },
//         "sales_count": 0,
//         "created_at": "2024-03-12T10:00:00.000Z",
//         "updated_at": "2024-03-12T10:00:00.000Z"
//     }
// }

// 2. Get All Products (with pagination and filters)
// GET http://localhost:3000/api/product?page=1&limit=10&category=categoryId&creator=creatorId

// Success Response (200):
// {
//     "success": true,
//     "data": {
//         "products": [
//             {
//                 // Same structure as single product response
//                 "_id": "66f091a9b511458168a109ca",
//                 "title": "Cool T-Shirt EEDFEF",
//                 // ... other fields
//             }
//         ],
//         "pagination": {
//             "total": 100,
//             "page": 1,
//             "limit": 10,
//             "pages": 10
//         }
//     }
// }

export async function PATCH(request: NextRequest) {
    try {
        await dbConnect()

        // Pre-register all required models
        await Promise.all([
            UserModel.findOne().exec(),
            ImageModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ShaderModel.findOne().exec(),
            CategoryModel.findOne().exec(),
            productModel.findOne().exec(),
            objectModel.findOne().exec()
        ]).catch(() => {})

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Authentication check
            const accessToken = request.cookies.get('accessToken')?.value
            const refreshToken = request.cookies.get('refreshToken')?.value

            if (!accessToken || !refreshToken) {
                return NextResponse.json({ error: 'No access token provided' }, { status: 401 })
            }

            // Find user within transaction
            const findUser = await AuthModel.findOne({ accessToken, refreshToken }, null, { session })

            if (!findUser) {
                return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
            }

            const formData = await request.formData()

            // Get all form fields
            const product_id = formData.get('product_id') as string

            // Validate product_id
            if (!product_id) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Product ID is required'
                    },
                    { status: 400 }
                )
            }

            // Find the product
            const product = await productModel.findById(product_id).session(session)

            if (!product) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Product not found'
                    },
                    { status: 404 }
                )
            }

            // Find the creator
            const creator = await CreatorModel.findById(product.creator_id).session(session)

            if (!creator) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Creator not found'
                    },
                    { status: 404 }
                )
            }

            // Check if the authenticated user is the creator of the product
            if (creator.userId.toString() !== findUser.userId.toString()) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'You do not have permission to update this product'
                    },
                    { status: 403 }
                )
            }

            // Get optional fields
            const title = formData.get('title') as string
            const description = formData.get('description') as string
            const category_id = formData.get('category_id') as string
            const price_amount = formData.get('price_amount') ? Number(formData.get('price_amount')) : undefined
            const price_currency = formData.get('price_currency') as string
            const image = formData.get('image') as File
            const shader = formData.get('shader') as File
            const shaderType = formData.get('shaderType') as string

            // Build update object
            const updateData: any = {}
            if (title) updateData.title = title
            if (description) updateData.description = description
            if (category_id) updateData.category_id = category_id.split(',')
            if (price_amount && price_currency) {
                updateData.price = {
                    amount: price_amount,
                    currency: price_currency
                }
            } else if (price_amount) {
                updateData.price = {
                    amount: price_amount,
                    currency: product.price.currency
                }
            } else if (price_currency) {
                updateData.price = {
                    amount: product.price.amount,
                    currency: price_currency
                }
            }

            // Handle image update
            if (image && image.size > 0) {
                // Upload new image to S3
                const imageBuffer = Buffer.from(await image.arrayBuffer())
                const imageFileName = `product-image-${creator._id}-${Date.now()}-${Math.random().toString(36).substring(7)}`

                const imageUploadResult = await uploadObjectToS3(imageBuffer, imageFileName, image.type || 'image/jpeg')

                if (!imageUploadResult.success) {
                    await session.abortTransaction()
                    session.endSession()
                    return Response.json(
                        {
                            success: false,
                            error: imageUploadResult.error || 'Failed to upload product image'
                        },
                        { status: 500 }
                    )
                }

                // Delete old image
                if (product.image_id) {
                    await ImageModel.findByIdAndDelete(product.image_id, {
                        session
                    })
                }

                // Create new image document with URL
                const [imageDetail] = await ImageModel.create(
                    [
                        {
                            user_id: creator._id,
                            image_url: imageUploadResult.url,
                            content_type: image.type || 'image/jpeg'
                        }
                    ],
                    { session }
                )

                updateData.image_id = imageDetail._id
            }

            // Handle shader update
            if (shader && shader.size > 0) {
                // Upload shader to S3
                const shaderBuffer = Buffer.from(await shader.arrayBuffer())
                const shaderFileName = `shader-image-${creator._id}-${Date.now()}-${Math.random().toString(36).substring(7)}`

                const shaderUploadResult = await uploadObjectToS3(
                    shaderBuffer,
                    shaderFileName,
                    shader.type || 'image/jpeg'
                )

                if (!shaderUploadResult.success) {
                    await session.abortTransaction()
                    session.endSession()
                    return Response.json(
                        {
                            success: false,
                            error: shaderUploadResult.error || 'Failed to upload shader image'
                        },
                        { status: 500 }
                    )
                }

                // First, find the existing shader
                const existingShader = await ShaderModel.findById(product.shader_id).session(session)

                // Delete old shader image
                if (existingShader && existingShader.shaderImage) {
                    await ImageModel.findByIdAndDelete(existingShader.shaderImage, { session })
                }

                // Create new shader image document with URL
                const [shaderImageDetail] = await ImageModel.create(
                    [
                        {
                            user_id: creator._id,
                            image_url: shaderUploadResult.url,
                            content_type: shader.type || 'image/jpeg'
                        }
                    ],
                    { session }
                )

                // Update shader
                if (existingShader) {
                    await ShaderModel.findByIdAndUpdate(
                        existingShader._id,
                        {
                            shaderImage: shaderImageDetail._id,
                            ...(shaderType && { shaderType })
                        },
                        { session }
                    )
                } else {
                    // Create new shader if it doesn't exist
                    const [newShader] = await ShaderModel.create(
                        [
                            {
                                user_id: creator._id,
                                shaderImage: shaderImageDetail._id,
                                shaderType: shaderType || 'basic',
                                product_id: product._id
                            }
                        ],
                        { session }
                    )
                    updateData.shader_id = newShader._id
                }
            } else if (shaderType) {
                // Update just the shader type
                const existingShader = await ShaderModel.findById(product.shader_id).session(session)
                if (existingShader) {
                    await ShaderModel.findByIdAndUpdate(existingShader._id, { shaderType }, { session })
                }
            }

            // Update product
            const updatedProduct = await productModel
                .findByIdAndUpdate(product_id, updateData, {
                    new: true,
                    session
                })
                .populate([
                    {
                        path: 'category_id',
                        model: 'categoryschema'
                    },
                    { path: 'model_id', model: 'Object' },
                    { path: 'creator_id', model: 'Creator' },
                    {
                        path: 'shader_id',
                        model: 'shaderSchema',
                        populate: {
                            path: 'shaderImage',
                            model: 'ImageDetail'
                        }
                    },
                    { path: 'image_id', model: 'ImageDetail' }
                ])

            // Commit the transaction
            await session.commitTransaction()
            session.endSession()

            return Response.json(
                {
                    success: true,
                    message: 'Product updated successfully',
                    data: updatedProduct
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
        console.error('Error updating product:', error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            { status: 500 }
        )
    }
}

// === Example Requests and Responses ===

// PATCH Product
// Request at: http://localhost:3000/api/product
// Method: PATCH
// Headers:
// - Cookie: accessToken=xxx; refreshToken=yyy

// FormData:
// - productId: "67e34283d001c2fc0ec7110d" (required)
// - title: "Updated T-Shirt Name" (optional)
// - description: "Updated description" (optional)
// - category_id: "67e2c2efa9e1238a162f5a3c" (optional)
// - model_id: "67e34283d001c2fc0ec7110c" (optional)
// - shader: (file) new-shader.jpg (optional)
// - price_amount: "1999" (optional)
// - price_currency: "INR" (optional)
// - image: (file) new-product-image.jpg (optional)
// - shaderType: "partial-body" (optional, required if shader is provided)

// Success Response (200):
// {
//     "success": true,
//     "message": "Product updated successfully",
//     "data": {
//         "_id": "67e34283d001c2fc0ec7110d",
//         "title": "Updated T-Shirt Name",
//         "description": "Updated description",
//         "category_id": [{
//             "_id": "67e2c2efa9e1238a162f5a3c",
//             "category_name": "T-Shirts"
//         }],
//         "model_id": {
//             "_id": "67e34283d001c2fc0ec7110c",
//             "name": "T-Shirt Model",
//             "modelUrl": "https://zodiac3k-bucket.s3.amazonaws.com/models/t-shirt.glb",
//             "position": { "x": 0, "y": 0, "z": 0 },
//             "rotation": { "x": 0, "y": 0, "z": 0 },
//             "scale": { "x": 1, "y": 1, "z": 1 }
//         },
//         "creator_id": {
//             "_id": "67e34283d001c2fc0ec7110e",
//             "userId": "67e34283d001c2fc0ec7110f",
//             "name": "Creator Name",
//             "bio": "Creative designer",
//             "quote": "Design is life",
//             "royaltyPercentage": 30
//         },
//         "shader_id": {
//             "_id": "67e34283d001c2fc0ec71111",
//             "shaderType": "partial-body",
//             "shaderImage": "67e34283d001c2fc0ec71112",
//             "product_id": "67e34283d001c2fc0ec7110d",
//             "mapping": {
//                 "scale": { "x": 1, "y": 1 },
//                 "offset": { "x": 0, "y": 0 },
//                 "rotation": 0
//             }
//         },
//         "price": {
//             "amount": 1999,
//             "currency": "INR"
//         },
//         "image_id": {
//             "_id": "67e34283d001c2fc0ec71113",
//             "user_id": "67e34283d001c2fc0ec7110e",
//             "content_type": "image/jpeg",
//             "data": "<Buffer ...>"
//         },
//         "sales_count": 0,
//         "created_at": "2024-03-12T10:00:00.000Z",
//         "updated_at": "2024-03-12T10:30:00.000Z"
//     }
// }

// Error Response (400) - Missing ID:
// {
//     "success": false,
//     "error": "Product ID is required"
// }

// Error Response (404) - Product Not Found:
// {
//     "success": false,
//     "error": "Product not found"
// }

// Error Response (400) - Duplicate Title:
// {
//     "success": false,
//     "error": "Product title already exists"
// }

// Error Response (401) - Authentication:
// {
//     "success": false,
//     "error": "Invalid access token"
// }

// Error Response (500) - Server Error:
// {
//     "success": false,
//     "error": "Failed to update product"
// }

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect()

        // Pre-register models
        await Promise.all([
            AuthModel.findOne().exec(),
            UserModel.findOne().exec(),
            ImageModel.findOne().exec(),
            CreatorModel.findOne().exec(),
            ShaderModel.findOne().exec(),
            productModel.findOne().exec()
        ]).catch(() => {})

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Authentication check
            const accessToken = request.cookies.get('accessToken')?.value
            const refreshToken = request.cookies.get('refreshToken')?.value

            if (!accessToken || !refreshToken) {
                return Response.json({ error: 'No access token provided' }, { status: 401 })
            }

            // Find user within transaction
            const findUser = await AuthModel.findOne({ accessToken, refreshToken }, null, { session })

            if (!findUser) {
                return Response.json({ error: 'Invalid access token' }, { status: 401 })
            }

            // Get product ID from URL
            const url = new URL(request.url)
            const productId = url.searchParams.get('productId')

            if (!productId) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Product ID is required'
                    },
                    { status: 400 }
                )
            }

            // Find the product
            const product = await productModel.findById(productId).session(session)

            if (!product) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Product not found'
                    },
                    { status: 404 }
                )
            }

            // Find the creator
            const creator = await CreatorModel.findById(product.creator_id).session(session)

            if (!creator) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'Creator not found'
                    },
                    { status: 404 }
                )
            }

            // Check if the authenticated user is the creator of the product
            if (creator.userId.toString() !== findUser.userId.toString()) {
                await session.abortTransaction()
                session.endSession()
                return Response.json(
                    {
                        success: false,
                        error: 'You do not have permission to delete this product'
                    },
                    { status: 403 }
                )
            }

            // Delete associated images and shader
            if (product.image_id) {
                await ImageModel.findByIdAndDelete(product.image_id, {
                    session
                })
                // Note: In a production environment, you should also delete the image from S3
                // using the URL stored in the image document
            }

            if (product.shader_id) {
                // Find the shader to get the associated image
                const shader = await ShaderModel.findById(product.shader_id).session(session)

                if (shader && shader.shaderImage) {
                    // Delete shader image
                    await ImageModel.findByIdAndDelete(shader.shaderImage, {
                        session
                    })
                    // Note: In a production environment, you should also delete the shader image from S3
                }

                // Delete the shader itself
                await ShaderModel.findByIdAndDelete(product.shader_id, {
                    session
                })
            }

            // Delete the product
            await productModel.findByIdAndDelete(productId, { session })

            // Update creator's products array
            await CreatorModel.findByIdAndUpdate(
                product.creator_id,
                {
                    $pull: { products: productId }
                },
                { session }
            )

            // Commit the transaction
            await session.commitTransaction()
            session.endSession()

            return Response.json(
                {
                    success: true,
                    message: 'Product deleted successfully'
                },
                { status: 200 }
            )
        } catch (error) {
            // Make sure to abort the transaction on error
            await session.abortTransaction()
            throw error
        } finally {
            session.endSession()
        }
    } catch (error) {
        console.error('Error deleting product:', error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            { status: 500 }
        )
    }
}

// === Example Requests and Responses ===

// DELETE Product
// Request at: http://localhost:3000/api/product?productId=67e34283d001c2fc0ec7110d
// Method: DELETE
// Headers:
// - Cookie: accessToken=xxx; refreshToken=yyy

// Success Response (200):
// {
//     "success": true,
//     "message": "Product and associated resources deleted successfully"
// }
