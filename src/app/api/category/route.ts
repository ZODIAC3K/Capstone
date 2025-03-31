import { NextRequest, NextResponse } from 'next/server'
import CategoryModel from '@/models/categorySchema'
import productModel from '@/models/productSchema'
import dbConnect from '@/lib/mongodb'
import { uploadObjectToS3 } from '@/utils/uploadObjectS3'

export async function GET(request: NextRequest) {
    try {
        const db = await dbConnect()
        if (!db) {
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
        }

        // Get all categories
        const categories = await CategoryModel.find()

        // Count products for each category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const count = await productModel.countDocuments({
                    category_id: { $in: [category._id] }
                })

                return {
                    ...category.toObject(),
                    count
                }
            })
        )

        return NextResponse.json(
            {
                success: true,
                data: categoriesWithCounts,
                categories: categoriesWithCounts // Include for backward compatibility with older code
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch categories'
            },
            { status: 400 }
        )
    }
}

// === Example JSON ===
// Request at: http://localhost:3000/api/category
// Method: GET
// Response:
// {
// 	"categories": [
// 		{
// 			"_id": "66f091a9b511458168a109ca",
// 			"category_name": "Category 1",
// 			"createdAt": "2024-03-25T00:00:00.000Z",
// 			"updatedAt": "2024-03-25T00:00:00.000Z"
// 		}
// 	]
// }

export async function POST(request: NextRequest) {
    try {
        const db = await dbConnect()
        if (!db) {
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
        }

        const formData = await request.formData()
        const category_name = formData.get('category_name') as string
        const description = formData.get('description') as string
        const image = formData.get('image') as File

        // Validate required fields
        if (!category_name || !image) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Category name and image are required'
                },
                { status: 400 }
            )
        }

        const category_exist = await CategoryModel.findOne({
            category_name
        })

        if (category_exist) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Category already exists'
                },
                { status: 400 }
            )
        }

        // Convert File to Buffer and get the MIME type
        const fileBuffer = Buffer.from(await image.arrayBuffer())
        const fileName = image.name
        const mimeType = image.type

        const uploadResult = await uploadObjectToS3(fileBuffer, fileName, mimeType)
        if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Failed to upload image')
        }

        // Create category only if image upload is successful
        const category = await CategoryModel.create({
            category_name,
            image_url: uploadResult.url,
            description: description || ''
        })

        return NextResponse.json(
            {
                success: true,
                data: category
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating category:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to create category'
            },
            { status: 400 }
        )
    }
}

// === Example JSON ===
// Request at: http://localhost:3000/api/category
// Method: POST
// Body:
// {
// 	"category_name": "Category 1"
// }

// Response:
// {
// 	"category": {
// 		"_id": "66f091a9b511458168a109ca",
// 		"category_name": "Category 1",
// 		"createdAt": "2024-03-25T00:00:00.000Z",
// 		"updatedAt": "2024-03-25T00:00:00.000Z"
// 	}
// }

export async function PATCH(request: NextRequest) {
    try {
        const db = await dbConnect()
        if (!db) {
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
        }

        const formData = await request.formData()
        const category_id = formData.get('category_id') as string
        const category_name = formData.get('category_name') as string
        const description = formData.get('description') as string
        const is_active = formData.get('is_active') as string
        const image = formData.get('image') as File

        if (!category_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Category ID is required'
                },
                { status: 400 }
            )
        }

        const updateData: any = {}
        if (category_name) updateData.category_name = category_name
        if (description !== null) updateData.description = description
        if (is_active !== null) updateData.is_active = is_active === 'true'

        // Upload new image if provided
        if (image && image.size > 0) {
            try {
                const fileBuffer = Buffer.from(await image.arrayBuffer())
                const fileName = image.name
                const mimeType = image.type

                const uploadResult = await uploadObjectToS3(fileBuffer, fileName, mimeType)
                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error(uploadResult.error || 'Failed to upload image')
                }
                updateData.image_url = uploadResult.url
            } catch (uploadError) {
                console.error('Error uploading to S3:', uploadError)
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to upload image'
                    },
                    { status: 500 }
                )
            }
        }

        const category = await CategoryModel.findByIdAndUpdate(category_id, updateData, { new: true })

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Category not found'
                },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                data: category
            },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Error updating category:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to update category'
            },
            { status: 400 }
        )
    }
}

// === Example JSON ===
// Request at: http://localhost:3000/api/category
// Method: PUT
// Body:
// {
// 	"category_id": "66f091a9b511458168a109ca",
// 	"category_name": "Category 1"
// }

// Response:
// {
// 	"category": {
// 		"_id": "66f091a9b511458168a109ca",
// 		"category_name": "Category 1",
// 		"createdAt": "2024-03-25T00:00:00.000Z",
// 		"updatedAt": "2024-03-25T00:00:00.000Z"
// 	}
// }

export async function DELETE(request: NextRequest) {
    try {
        const db = await dbConnect()
        if (!db) {
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
        }
        const { category_id } = await request.json()
        if (!category_id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
        }
        const category = await CategoryModel.findByIdAndDelete(category_id)
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }
        return NextResponse.json({ message: 'Category deleted successfully', category }, { status: 200 })
    } catch (error: any) {
        console.error('Error deleting category:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 400 })
    }
}

// === Example JSON ===
// Request at: http://localhost:3000/api/category
// Method: DELETE
// Body:
// {
// 	"category_id": "66f091a9b511458168a109ca"
// }

// Response:
// {
// 	"message": "Category deleted successfully"
// }
