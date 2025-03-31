'use client'
import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import ErrorMsg from '../common/err-message'
import { notifySuccess, notifyError } from '@/utils/toast'

interface IFormInput {
    name: string
    email: string
    subject: string
    message: string
}

const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [debugInfo, setDebugInfo] = useState<string | null>(null)
    const [showFallback, setShowFallback] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<IFormInput>()

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            setIsSubmitting(true)
            setDebugInfo(null)

            console.log('Submitting form data:', data)

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            const responseData = await response.json()
            console.log('Response from server:', response.status, responseData)

            if (!response.ok) {
                setDebugInfo(`Error ${response.status}: ${JSON.stringify(responseData)}`)
                throw new Error(responseData.error || 'Failed to send message')
            }

            notifySuccess('Message sent successfully!')
            reset()
        } catch (error) {
            console.error('Contact form error:', error)
            if (error instanceof Error) {
                notifyError(error.message)
                if (!debugInfo) {
                    setDebugInfo(`Error: ${error.message}`)
                }
                setShowFallback(true)
            } else {
                notifyError('An unknown error occurred')
                setDebugInfo(`Unknown error: ${JSON.stringify(error)}`)
                setShowFallback(true)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFallbackEmail = () => {
        const subject = encodeURIComponent(document.getElementById('subject')?.value || 'Contact Form Submission')
        const body = encodeURIComponent(
            `Name: ${document.getElementById('name')?.value || ''}\n` +
                `Email: ${document.getElementById('email')?.value || ''}\n\n` +
                `Message:\n${document.getElementById('message')?.value || ''}`
        )
        window.open(`mailto:harshdeepanshustrix@gmail.com?subject=${subject}&body=${body}`, '_blank')
    }

    return (
        <>
            <style jsx global>{`
                @keyframes spinner {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
                .submit-spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid rgba(34, 197, 94, 0.3);
                    border-top-color: #22c55e;
                    animation: spinner 1s linear infinite;
                }
            `}</style>
            <form onSubmit={handleSubmit(onSubmit)} id='contact-form'>
                <div className='row'>
                    <div className='col-sm-6'>
                        <ErrorMsg msg={errors.name?.message as string} />
                        <div className='input-grp'>
                            <input
                                {...register('name', { required: `Name is required!` })}
                                name='name'
                                id='name'
                                type='text'
                                placeholder='Name *'
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className='col-sm-6'>
                        <ErrorMsg msg={errors.email?.message as string} />
                        <div className='input-grp'>
                            <input
                                {...register('email', { required: `Email is required!` })}
                                name='email'
                                id='email'
                                type='email'
                                placeholder='Email *'
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
                <div className='input-grp'>
                    <ErrorMsg msg={errors.subject?.message as string} />
                    <input
                        {...register('subject', { required: `Subject is required!` })}
                        name='subject'
                        id='subject'
                        type='text'
                        placeholder='Subject *'
                        disabled={isSubmitting}
                    />
                </div>
                <div className='input-grp message-grp'>
                    <ErrorMsg msg={errors.message?.message as string} />
                    <textarea
                        {...register('message', { required: `Message is required!` })}
                        id='message'
                        name='message'
                        cols={30}
                        rows={10}
                        placeholder='Enter your message'
                        disabled={isSubmitting}
                    />
                </div>
                <button
                    type='submit'
                    className='submit-btn'
                    disabled={isSubmitting}
                    style={
                        isSubmitting
                            ? { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
                            : {}
                    }
                >
                    {isSubmitting ? (
                        <>
                            <span className='submit-spinner'></span>
                            <span>Sending...</span>
                        </>
                    ) : (
                        'Submit Now'
                    )}
                </button>

                {debugInfo && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '10px',
                            background: '#ffe0e0',
                            color: '#d32f2f',
                            fontSize: '14px',
                            borderRadius: '4px'
                        }}
                    >
                        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Debug Information:</p>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{debugInfo}</pre>
                    </div>
                )}

                {showFallback && (
                    <div
                        style={{
                            marginTop: '20px',
                            padding: '15px',
                            background: '#e8f4fd',
                            color: '#0a67a3',
                            borderRadius: '4px',
                            textAlign: 'center'
                        }}
                    >
                        <p style={{ marginBottom: '10px' }}>
                            Having trouble with our contact form? Click below to send us an email directly:
                        </p>
                        <button
                            type='button'
                            onClick={handleFallbackEmail}
                            style={{
                                background: '#0a67a3',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Email Us Directly
                        </button>
                    </div>
                )}
            </form>
        </>
    )
}

export default ContactForm
