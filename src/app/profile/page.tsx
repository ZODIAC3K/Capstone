'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import styles from '../creator-profile/styles/CreatorProfile.module.css'

// User data interface
interface UserData {
    _id?: string
    email: string
    fname: string
    lname: string
    mobile: string
    profile_picture?: {
        image_url?: string
        data?: string | Buffer
        content_type?: string
    }
    email_verification?: boolean
}

const UserProfilePage = () => {
    const router = useRouter()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showChangePassword, setShowChangePassword] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        mobile: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Fetch user data when component mounts
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true)
                const response = await fetch('http://localhost:3000/api/user', {
                    method: 'GET',
                    credentials: 'include'
                })

                if (!response.ok) {
                    // If not authenticated, redirect to login
                    if (response.status === 401) {
                        router.push('/login')
                        return
                    }

                    throw new Error(`Error ${response.status}: ${await response.text()}`)
                }

                const data = await response.json()
                setUserData(data)

                // Initialize form data
                setFormData({
                    ...formData,
                    fname: data.fname || '',
                    lname: data.lname || '',
                    mobile: data.mobile || ''
                })
            } catch (err) {
                console.error('Error fetching user profile:', err)
                setError(err instanceof Error ? err.message : 'Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile()
    }, [router])

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle file selection for profile image
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(e.target.files[0])
        }
    }

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setSuccessMessage(null)
        setIsSubmitting(true)

        try {
            // Validation for password change
            if (showChangePassword) {
                if (!formData.currentPassword) {
                    throw new Error('Current password is required')
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('New passwords do not match')
                }
                if (formData.newPassword && formData.newPassword.length < 8) {
                    throw new Error('New password must be at least 8 characters long')
                }
            }

            // Create FormData
            const submitFormData = new FormData()
            submitFormData.append('fname', formData.fname)
            submitFormData.append('lname', formData.lname)
            submitFormData.append('mobile', formData.mobile)

            // Add password fields if changing password
            if (showChangePassword && formData.currentPassword) {
                submitFormData.append('currentPassword', formData.currentPassword)
                submitFormData.append('newPassword', formData.newPassword)
            }

            // Add profile image if selected
            if (profileImage) {
                submitFormData.append('profile_picture', profileImage)
            }

            // Send update request
            const response = await fetch('http://localhost:3000/api/user', {
                method: 'PATCH',
                body: submitFormData,
                credentials: 'include'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to update profile: ${response.status}`)
            }

            const updatedUser = await response.json()
            setUserData(updatedUser)
            setSuccessMessage('Profile updated successfully')

            // Clear password fields after successful update
            if (showChangePassword) {
                setFormData({
                    ...formData,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                setShowChangePassword(false)
            }
        } catch (err) {
            console.error('Error updating profile:', err)
            setFormError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get profile image URL
    const getProfileImageUrl = () => {
        if (!userData || !userData.profile_picture) return '/placeholder.png'

        if (userData.profile_picture.image_url) {
            return userData.profile_picture.image_url
        }

        // Legacy support for buffer data
        if (userData.profile_picture.data && userData.profile_picture.content_type) {
            const base64 =
                typeof userData.profile_picture.data === 'string'
                    ? userData.profile_picture.data
                    : Buffer.from(userData.profile_picture.data).toString('base64')
            return `data:${userData.profile_picture.content_type};base64,${base64}`
        }

        return '/placeholder.png'
    }

    if (loading) {
        return (
            <Wrapper>
                <div
                    style={{
                        backgroundColor: '#0c0c0c',
                        minHeight: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'fixed',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        zIndex: 1000
                    }}
                >
                    <div
                        className={styles.loadingSpinner}
                        style={{
                            width: '4rem',
                            height: '4rem',
                            borderColor: 'rgba(34, 197, 94, 0.3)',
                            borderTopColor: '#22c55e',
                            margin: 0
                        }}
                    ></div>
                </div>
            </Wrapper>
        )
    }

    if (error) {
        return (
            <Wrapper>
                <div className={`${styles.pageBackground} flex flex-col items-center justify-center p-4 min-h-screen`}>
                    <div className={styles.formContainer} style={{ maxWidth: '500px', textAlign: 'center' }}>
                        <h1 className={styles.pageTitle} style={{ fontSize: '1.5rem' }}>
                            Error Loading Profile
                        </h1>
                        <div className={styles.errorMessage}>{error}</div>
                        <div className='flex space-x-4 justify-center mt-6'>
                            <Link href='/' className={styles.button}>
                                Go Back Home
                            </Link>
                        </div>
                    </div>
                </div>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
            <Header />
            <main className={styles.pageBackground}>
                <div className={styles.container}>
                    <div className='py-12 pt-16'>
                        <h1 className={styles.pageTitle}>YOUR PROFILE</h1>
                        <p className={styles.pageSubtitle}>Manage your personal information and account settings</p>

                        <div className={styles.formContainer}>
                            {formError && <div className={styles.errorMessage}>{formError}</div>}
                            {successMessage && (
                                <div
                                    className={styles.successMessage}
                                    style={{
                                        marginBottom: '1.5rem',
                                        padding: '1rem',
                                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                        color: '#22c55e',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #16a34a'
                                    }}
                                >
                                    {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className={styles.formRow} style={{ display: 'flex', gap: '1rem' }}>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label htmlFor='fname' className={styles.formLabel}>
                                            First Name <span className={styles.requiredIndicator}>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            id='fname'
                                            name='fname'
                                            value={formData.fname}
                                            onChange={handleInputChange}
                                            required
                                            className={styles.textInput}
                                            placeholder='Your first name'
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label htmlFor='lname' className={styles.formLabel}>
                                            Last Name <span className={styles.requiredIndicator}>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            id='lname'
                                            name='lname'
                                            value={formData.lname}
                                            onChange={handleInputChange}
                                            required
                                            className={styles.textInput}
                                            placeholder='Your last name'
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor='mobile' className={styles.formLabel}>
                                        Mobile Number <span className={styles.requiredIndicator}>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        id='mobile'
                                        name='mobile'
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        required
                                        className={styles.textInput}
                                        placeholder='Your mobile number'
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor='email' className={styles.formLabel}>
                                        Email Address
                                    </label>
                                    <input
                                        type='email'
                                        id='email'
                                        value={userData?.email || ''}
                                        disabled
                                        className={styles.textInput}
                                        style={{ backgroundColor: '#2a2a2a', cursor: 'not-allowed' }}
                                    />
                                    <p style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.5rem' }}>
                                        Email address cannot be changed
                                    </p>
                                </div>

                                <div className={styles.fileInputWrapper}>
                                    <label htmlFor='profilePicture' className={styles.formLabel}>
                                        Profile Picture {userData?.profile_picture && '(Leave empty to keep current)'}
                                    </label>
                                    <div className='relative'>
                                        <input
                                            type='file'
                                            id='profilePicture'
                                            accept='image/*'
                                            onChange={handleFileChange}
                                            className={styles.fileInput}
                                        />
                                        <div className={styles.fileInputDisplay}>
                                            <span>{profileImage ? profileImage.name : 'Choose file'}</span>
                                            <span className={styles.browseButton}>Browse</span>
                                        </div>
                                    </div>
                                    {profileImage && <p className={styles.fileSelected}>File selected</p>}

                                    {/* Current profile image preview */}
                                    {!profileImage && userData?.profile_picture && (
                                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                            <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>
                                                Current profile picture
                                            </p>
                                            <div
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    margin: '0 auto'
                                                }}
                                            >
                                                <Image
                                                    src={getProfileImageUrl()}
                                                    alt='Profile'
                                                    width={100}
                                                    height={100}
                                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Password change section (togglable) */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <button
                                        type='button'
                                        onClick={() => setShowChangePassword(!showChangePassword)}
                                        className={styles.button}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: '#22c55e',
                                            border: '1px solid #22c55e',
                                            padding: '0.5rem 1rem'
                                        }}
                                    >
                                        {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
                                    </button>
                                </div>

                                {showChangePassword && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label htmlFor='currentPassword' className={styles.formLabel}>
                                                Current Password <span className={styles.requiredIndicator}>*</span>
                                            </label>
                                            <input
                                                type='password'
                                                id='currentPassword'
                                                name='currentPassword'
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                required={showChangePassword}
                                                className={styles.textInput}
                                                placeholder='Enter your current password'
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label htmlFor='newPassword' className={styles.formLabel}>
                                                New Password <span className={styles.requiredIndicator}>*</span>
                                            </label>
                                            <input
                                                type='password'
                                                id='newPassword'
                                                name='newPassword'
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                required={showChangePassword}
                                                className={styles.textInput}
                                                placeholder='Enter new password'
                                                minLength={8}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label htmlFor='confirmPassword' className={styles.formLabel}>
                                                Confirm New Password <span className={styles.requiredIndicator}>*</span>
                                            </label>
                                            <input
                                                type='password'
                                                id='confirmPassword'
                                                name='confirmPassword'
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                required={showChangePassword}
                                                className={styles.textInput}
                                                placeholder='Confirm new password'
                                            />
                                        </div>
                                    </>
                                )}

                                <div className={styles.formActions}>
                                    <button type='submit' disabled={isSubmitting} className={styles.submitButton}>
                                        {isSubmitting ? (
                                            <div className={styles.loadingContainer}>
                                                <div className={styles.loadingSpinner}></div>
                                                Updating Profile...
                                            </div>
                                        ) : (
                                            'Update Profile'
                                        )}
                                    </button>

                                    <Link
                                        href='/'
                                        className={styles.cancelButton}
                                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </Wrapper>
    )
}

export default UserProfilePage
