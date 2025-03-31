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

        // Create email transporter with extended timeout
        console.log('Creating email transporter')

        // For Gmail, we use direct service config with longer timeout
        const transportConfig: any = {
            service: 'gmail',
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD
            },
            connectionTimeout: 60000, // 60 seconds connection timeout
            socketTimeout: 60000, // 60 seconds socket timeout
            greetingTimeout: 30000, // 30 seconds greeting timeout
            debug: true, // Enable debugging
            logger: true // Log to console
        }

        const transporter = nodemailer.createTransport(transportConfig)

        try {
            // Verify transporter
            console.log('Verifying transporter connection')
            await transporter
                .verify()
                .then(() => console.log('Transporter verified successfully'))
                .catch((error) => {
                    console.error('Transporter verification failed:', error)
                    // Continue anyway as sometimes verify fails but sending still works
                })

            // Create HTML content for the email
            const htmlContent = `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `

            // Try sending email to admin
            console.log('Sending email to admin:', ADMIN_EMAIL)
            let info
            try {
                info = await transporter.sendMail({
                    from: MAIL_USERNAME,
                    to: ADMIN_EMAIL,
                    subject: `Contact Form: ${subject}`,
                    text: `New contact form submission from ${name} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
                    html: htmlContent
                })
                console.log('Admin email sent:', info.messageId)
            } catch (emailError) {
                console.error('Failed to send admin email:', emailError)
                throw emailError
            }

            // If admin email succeeds, try confirmation email
            try {
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
            } catch (confirmError) {
                // If confirmation email fails, log it but don't fail the whole operation
                console.error('Failed to send confirmation email:', confirmError)
            }

            console.log('Contact form submission completed successfully')
            return NextResponse.json({
                success: true,
                messageId: info?.messageId || 'unknown'
            })
        } catch (emailError: any) {
            if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ESOCKET' || emailError.code === 23) {
                console.error('Email sending timed out:', emailError)
                return NextResponse.json(
                    {
                        error: 'Email sending timed out. Please try the direct email option below.',
                        fallback: true
                    },
                    { status: 504 } // Gateway Timeout
                )
            }

            // Re-throw for general error handling
            throw emailError
        }
    } catch (error: any) {
        console.error('Contact form submission failed:', error)
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response
        })

        // Special handling for common Gmail issues
        if (error.message?.includes('Invalid login')) {
            return NextResponse.json(
                { error: 'Email authentication failed. Please use the direct email option below.', fallback: true },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to submit contact form', fallback: true },
            { status: 500 }
        )
    }
}
