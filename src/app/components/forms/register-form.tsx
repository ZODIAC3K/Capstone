'use client'
import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import ErrorMsg from '../common/err-message'
import { notifySuccess } from '@/utils/toast'

interface IFormInput {
    fname: string
    lname: string
    email: string
    password: string
    confirmPassword: string
    mobile: string
}

export default function RegisterForm() {
    const [profilePicture, setProfilePicture] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm<IFormInput>()

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            // Set loading state to true
            setIsSubmitting(true)

            // Create FormData object to send both text fields and file
            const formData = new FormData()
            formData.append('email', data.email)
            formData.append('password', data.password)
            formData.append('fname', data.fname)
            formData.append('lname', data.lname)
            formData.append('mobile', data.mobile)

            // Add profile picture if selected
            if (profilePicture) {
                formData.append('profile_picture', profilePicture)
            }

            const response = await fetch('http://localhost:3000/api/user', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Registration failed: ${response.status}`)
            }

            notifySuccess('Register successfully!')
            reset()
            setProfilePicture(null)
            setImagePreview(null)
        } catch (error) {
            console.error('Registration error:', error)
            alert(error instanceof Error ? error.message : 'Registration failed')
        } finally {
            // Set loading state back to false
            setIsSubmitting(false)
        }
    }

    // Handle file selection for profile picture
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setProfilePicture(file)

            // Create a preview URL for the selected image
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Add CSS for the loading spinner
    const spinnerStyle = {
        display: 'inline-block',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid rgba(34, 197, 94, 0.3)',
        borderTopColor: '#22c55e',
        animation: 'spin 1s linear infinite',
        marginRight: '10px'
    }

    // Add keyframes for the animation in your component
    const keyframesStyle = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    `

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='account__form'>
            <div className='row gutter-20'>
                <div className='col-md-6'>
                    <ErrorMsg msg={errors.fname?.message as string} />
                    <div className='form-grp'>
                        <label htmlFor='fast-name'>First Name</label>
                        <input
                            {...register('fname', { required: `First name is required!` })}
                            type='text'
                            id='fast-name'
                            placeholder='First Name'
                        />
                    </div>
                </div>
                <div className='col-md-6'>
                    <ErrorMsg msg={errors.lname?.message as string} />
                    <div className='form-grp'>
                        <label htmlFor='last-name'>Last name</label>
                        <input
                            {...register('lname', { required: `Last name is required!` })}
                            type='text'
                            id='last-name'
                            placeholder='Last name'
                        />
                    </div>
                </div>
            </div>

            <ErrorMsg msg={errors.mobile?.message as string} />
            <div className='form-grp'>
                <label htmlFor='mobile'>Mobile Number</label>
                <input
                    {...register('mobile', {
                        required: `Mobile number is required!`,
                        pattern: {
                            value: /^\d{10}$/,
                            message: 'Please enter a valid 10-digit mobile number'
                        }
                    })}
                    type='text'
                    id='mobile'
                    placeholder='Mobile Number'
                />
            </div>

            <ErrorMsg msg={errors.email?.message as string} />
            <div className='form-grp'>
                <label htmlFor='email'>Email</label>
                <input
                    {...register('email', {
                        required: `Email is required!`,
                        pattern: {
                            value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                            message: 'Please enter a valid email address'
                        }
                    })}
                    type='email'
                    id='email'
                    placeholder='Email'
                />
            </div>

            <div className='form-grp'>
                <label htmlFor='profile-picture'>Profile Picture</label>
                <input
                    type='file'
                    id='profile-picture'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='form-control'
                />
                {profilePicture && (
                    <div
                        className='mt-3'
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <p className='text-sm mb-2'>Selected: {profilePicture.name}</p>
                        {imagePreview && (
                            <div
                                className='image-preview'
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    marginTop: '10px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '2px solid #22c55e'
                                }}
                            >
                                <img
                                    src={imagePreview}
                                    alt='Profile preview'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ErrorMsg msg={errors.password?.message as string} />
            <div className='form-grp'>
                <label htmlFor='password'>Password</label>
                <input
                    {...register('password', {
                        required: `Password is required!`,
                        minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters long'
                        },
                        pattern: {
                            value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!(){}[\]:;"'<>,.?/~\-_]).{8,}$/,
                            message:
                                'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
                        }
                    })}
                    type='password'
                    id='password'
                    placeholder='Password'
                />
            </div>

            <ErrorMsg msg={errors.confirmPassword?.message as string} />
            <div className='form-grp'>
                <label htmlFor='confirm-password'>Confirm Password</label>
                <input
                    {...register('confirmPassword', {
                        required: true,
                        validate: (val: string) => {
                            if (watch('password') != val) {
                                return 'Your passwords do not match'
                            }
                        }
                    })}
                    type='password'
                    id='confirm-password'
                    placeholder='Confirm Password'
                />
            </div>
            <style>{keyframesStyle}</style>
            <button
                type='submit'
                className='btn btn-two arrow-btn'
                disabled={isSubmitting}
                style={isSubmitting ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
            >
                {isSubmitting ? (
                    <>
                        <span style={spinnerStyle}></span>
                        <span>Signing Up...</span>
                    </>
                ) : (
                    'Sign Up'
                )}
            </button>
        </form>
    )
}
