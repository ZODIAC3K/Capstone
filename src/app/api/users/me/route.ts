import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import UserModel from '@/models/userSchema'
import { getUserFromToken } from '@/utils/auth'

// GET: Fetch the currently logged in user
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        await UserModel.findOne()
            .exec()
            .catch(() => {})

        // Get user from token
        const user = await getUserFromToken(request)
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not authenticated'
                },
                { status: 401 }
            )
        }

        // Return user data without sensitive information
        return NextResponse.json(
            {
                success: true,
                user: {
                    _id: user._id,
                    fname: user.fname,
                    lname: user.lname,
                    email: user.email,
                    profile_picture: user.profile_picture
                }
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching current user:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch user data'
            },
            { status: 500 }
        )
    }
}
