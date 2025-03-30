import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import UserModel from '@/models/userSchema'
import { NextRequest } from 'next/server'

interface TokenPayload {
    userId: string
    email?: string
    iat?: number
    exp?: number
}

export async function getUserFromToken(request?: NextRequest) {
    try {
        // Get token from cookies
        const cookieStore = cookies()
        const token = cookieStore.get('accessToken')?.value

        // If no token in cookies and request is provided, check authorization header
        let headerToken = null
        if (!token && request) {
            const authHeader = request.headers.get('authorization')
            if (authHeader && authHeader.startsWith('Bearer ')) {
                headerToken = authHeader.substring(7)
            }
        }

        const accessToken = token || headerToken

        if (!accessToken) {
            return null
        }

        // Verify token
        const jwtSecret = process.env.JWT_SECRET || 'zodiac3k'
        const decoded = jwt.verify(accessToken, jwtSecret) as TokenPayload

        if (!decoded || !decoded.userId) {
            return null
        }

        // Get user from database
        const user = await UserModel.findById(decoded.userId)
        if (!user) {
            return null
        }

        return user
    } catch (error) {
        console.error('Error getting user from token:', error)
        return null
    }
}
