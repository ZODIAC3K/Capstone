'use client'
import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import ErrorMsg from '../common/err-message'
import { notifySuccess, notifyError } from '@/utils/toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface IFormInput {
    email: string
    password: string
}

export default function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [verificationError, setVerificationError] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<IFormInput>()

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        setIsLoading(true)
        setVerificationError(null)

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const responseData = await response.json()

                // Special handling for email verification error (status 403)
                if (response.status === 403 && responseData.error === 'Please verify your email before logging in') {
                    setVerificationError(responseData.error)
                    setUserEmail(data.email)
                    // Don't throw error here, just return to avoid the login failed notification
                    return
                }
                // Instead of throwing an error, just display the error toast
                notifyError(responseData.error || 'Login failed')
                return
            }

            const responseData = await response.json()

            // Store tokens in localStorage (client-side only)
            localStorage.setItem('accessToken', responseData.accessToken)
            localStorage.setItem('refreshToken', responseData.refreshToken)

            // Store user info
            if (responseData.user) {
                localStorage.setItem('user', JSON.stringify(responseData.user))
            }

            // Dispatch custom event to update UI
            window.dispatchEvent(new Event('authStateChanged'))

            notifySuccess('Login successful!')

            // Redirect to dashboard after successful login
            setTimeout(() => {
                router.push('/creator-profile')
            }, 1000)
        } catch (error) {
            console.error('Login error:', error)
            notifyError(error instanceof Error ? error.message : 'Login failed!')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!userEmail) return

        try {
            setIsLoading(true)
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userEmail })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to resend verification email')
            }

            notifySuccess('Verification email sent successfully!')
            setVerificationError(null)
        } catch (error) {
            console.error('Error sending verification email:', error)
            notifyError(error instanceof Error ? error.message : 'Failed to send verification email')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {verificationError && (
                <div
                    className='verification-error'
                    style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #ef4444',
                        textAlign: 'center'
                    }}
                >
                    <p style={{ marginBottom: '0.75rem' }}>{verificationError}</p>
                    <button
                        onClick={handleResendVerification}
                        disabled={isLoading}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {isLoading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className='account__form'>
                <ErrorMsg msg={errors.email?.message as string} />
                <div className='form-grp'>
                    <label htmlFor='email'>Email</label>
                    <input
                        {...register('email', {
                            required: `Email is required!`,
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                        id='email'
                        type='email'
                        placeholder='Your Email'
                        disabled={isLoading}
                    />
                </div>

                <ErrorMsg msg={errors.password?.message as string} />
                <div className='form-grp'>
                    <label htmlFor='password'>Password</label>
                    <input
                        {...register('password', {
                            required: `Password is required!`,
                            minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters'
                            }
                        })}
                        id='password'
                        type='password'
                        placeholder='Password'
                        disabled={isLoading}
                    />
                </div>

                <div className='account__check'>
                    <div className='account__check-remember'>
                        <input type='checkbox' className='form-check-input' id='terms-check' />
                        <label htmlFor='terms-check' className='form-check-label'>
                            Remember me
                        </label>
                    </div>
                    <div className='account__check-forgot'>
                        <Link href='/reset-password'>Forgot Password?</Link>
                    </div>
                </div>

                <button
                    type='submit'
                    className='btn btn-two arrow-btn'
                    disabled={isLoading}
                    style={
                        isLoading ? { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' } : {}
                    }
                >
                    {isLoading ? (
                        <>
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(34, 197, 94, 0.3)',
                                    borderTopColor: '#22c55e',
                                    animation: 'spin 1s linear infinite'
                                }}
                            ></span>
                            <span>Logging in...</span>
                        </>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>

            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </>
    )
}
