import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

const { HOST, SERVICE, EMAIL_PORT, SECURE, MAIL_USERNAME, MAIL_PASSWORD, ADMIN_EMAIL } = process.env

export async function POST(request: NextRequest) {
    try {
        console.log('Contact form submission started')

        // Log environment variables (without passwords)
        console.log('Email config:', {
            host: HOST,
            service: SERVICE,
            port: EMAIL_PORT,
            secure: SECURE,
            username: MAIL_USERNAME ? 'Set' : 'Not set',
            password: MAIL_PASSWORD ? 'Set' : 'Not set',
            adminEmail: ADMIN_EMAIL || 'Not set'
        })

        // Parse request
        const { name, email, subject, message } = await request.json()
        console.log('Received form data:', { name, email, subject, messageLength: message?.length })

        // Validate required fields
        if (!name || !email || !subject || !message) {
            console.log('Validation failed - missing fields')
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        // Create email transporter
        console.log('Creating email transporter')

        // For Gmail, we use direct service config
        const transportConfig: any = {
            service: 'gmail',
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD
            },
            debug: true, // Enable debugging
            logger: true // Log to console
        }

        const transporter = nodemailer.createTransport(transportConfig)

        // Verify transporter
        console.log('Verifying transporter connection')
        await transporter
            .verify()
            .then(() => console.log('Transporter verified successfully'))
            .catch((error) => console.error('Transporter verification failed:', error))

        // Create HTML content for the email
        const htmlContent = `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `

        // Send email to admin
        console.log('Sending email to admin:', ADMIN_EMAIL)
        const info = await transporter.sendMail({
            from: MAIL_USERNAME,
            to: ADMIN_EMAIL,
            subject: `Contact Form: ${subject}`,
            text: `New contact form submission from ${name} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
            html: htmlContent
        })
        console.log('Admin email sent:', info.messageId)

        // Send confirmation email to the user
        console.log('Sending confirmation email to:', email)
        const userHtmlContent = `
            <h2>Thank you for contacting us!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you soon.</p>
            <p>Best regards,<br>Your Team</p>
        `

        const userConfirmation = await transporter.sendMail({
            from: MAIL_USERNAME,
            to: email,
            subject: 'Thank you for contacting us',
            text: `Dear ${name},\n\nWe have received your message and will get back to you soon.\n\nBest regards,\nYour Team`,
            html: userHtmlContent
        })
        console.log('User confirmation email sent:', userConfirmation.messageId)

        console.log('Contact form submission completed successfully')
        return NextResponse.json({
            success: true,
            messageId: info.messageId
        })
    } catch (error: any) {
        console.error('Contact form submission failed:', error)
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response
        })

        return NextResponse.json({ error: error.message || 'Failed to submit contact form' }, { status: 500 })
    }
}
