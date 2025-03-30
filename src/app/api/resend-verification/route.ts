import { NextRequest, NextResponse } from 'next/server'
import UserModel from '@/models/userSchema'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import { tokenModel } from '@/models/tokenSchema'
import jwt from 'jsonwebtoken'
import { sendEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
    let session

    try {
        // Connect to database
        const db = await dbConnect()
        if (!db) {
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
        }

        // Parse request body
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Find the user
        const user = await UserModel.findOne({ email })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user's email is already verified
        if (user.email_verification) {
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
        }

        // Start a MongoDB session for the transaction
        session = await mongoose.startSession()
        session.startTransaction()

        try {
            // Remove any existing verification tokens for this user
            await tokenModel.deleteMany(
                {
                    userId: user._id,
                    description: 'email-verification',
                    status: false
                },
                { session }
            )

            // Create a new verification token
            const verificationToken = new tokenModel({
                userId: user._id,
                token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'zodiac3k', {
                    expiresIn: '7d'
                }),
                description: 'email-verification'
            })

            await verificationToken.save({ session })

            // Create verification link
            const verificationLink = `${process.env.APP_URL}/verify/${user._id}/${verificationToken.token}`

            // Send verification email
            await sendEmail({
                email: user.email,
                subject: 'Email Verification',
                text: `Click the following link to verify your email: ${verificationLink}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
            <p>Hello ${user.fname},</p>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
            </div>
            <p>If the button doesn't work, you can also click on this link or copy it to your browser:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>This link will expire in 7 days.</p>
            <p>If you did not request this email, please ignore it.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Your Application Name. All rights reserved.</p>
            </div>
          </div>
        `
            })

            // Commit the transaction
            await session.commitTransaction()
            console.log('Transaction committed: Verification email sent')

            return NextResponse.json({ message: 'Verification email sent successfully' }, { status: 200 })
        } catch (error) {
            // If any error occurs, abort the transaction
            if (session.inTransaction()) {
                await session.abortTransaction()
            }
            throw error
        }
    } catch (error) {
        console.error('Error sending verification email:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send verification email' },
            { status: 500 }
        )
    } finally {
        // End the session if it exists
        if (session) {
            await session.endSession()
        }
    }
}
