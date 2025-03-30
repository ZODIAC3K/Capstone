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
    savedAddress?: Address[]
}

// Address interface
interface Address {
    _id: string
    address: {
        firstLine: string
        secondLine?: string
        pincode: number
        city: string
        state: string
    }
    default: boolean
}

const UserProfilePage = () => {
    const router = useRouter()
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showChangePassword, setShowChangePassword] = useState(false)

    // Address management state
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [addressFormData, setAddressFormData] = useState({
        firstLine: '',
        secondLine: '',
        pincode: '',
        city: '',
        state: ''
    })
    const [addressFormError, setAddressFormError] = useState<string | null>(null)
    const [addressSubmitting, setAddressSubmitting] = useState(false)
    const [addressSuccessMessage, setAddressSuccessMessage] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<'profile' | 'addresses'>('profile')

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

    // Add state for deletion confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

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

    // Fetch addresses when component mounts
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                console.log('Fetching addresses...')
                const response = await fetch('http://localhost:3000/api/address', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    console.warn(`Failed to fetch addresses: ${response.status}`)
                    return
                }

                const data = await response.json()
                console.log('Address data received:', data)

                if (data.addresses && Array.isArray(data.addresses)) {
                    console.log('Setting addresses from data.addresses array:', data.addresses.length)
                    setAddresses(data.addresses)
                } else {
                    console.warn('Unexpected address data format:', data)
                }
            } catch (err) {
                console.error('Error fetching addresses:', err)
            }
        }

        if (userData && userData._id && activeSection === 'addresses') {
            fetchAddresses()
        }
    }, [userData, activeSection])

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

    // Handle address form input change
    const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setAddressFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle address form submission
    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAddressFormError(null)
        setAddressSuccessMessage(null)
        setAddressSubmitting(true)

        try {
            // Validate form
            if (
                !addressFormData.firstLine ||
                !addressFormData.pincode ||
                !addressFormData.city ||
                !addressFormData.state
            ) {
                throw new Error('Please fill all required fields')
            }

            const method = selectedAddress ? 'PATCH' : 'POST'
            const body: any = {
                address: {
                    firstLine: addressFormData.firstLine,
                    secondLine: addressFormData.secondLine,
                    pincode: parseInt(addressFormData.pincode),
                    city: addressFormData.city,
                    state: addressFormData.state
                }
            }

            // If updating, include address ID
            if (selectedAddress) {
                body.addressId = selectedAddress._id
            }

            const response = await fetch('http://localhost:3000/api/address', {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    errorData.error || `Failed to ${selectedAddress ? 'update' : 'add'} address: ${response.status}`
                )
            }

            const result = await response.json()

            // Refresh address list
            if (selectedAddress) {
                // Update the address in the list
                setAddresses((prev) => prev.map((addr) => (addr._id === selectedAddress._id ? result.address : addr)))
                setAddressSuccessMessage('Address updated successfully')
            } else {
                // Add new address to the list
                setAddresses((prev) => [...prev, result.address])
                setAddressSuccessMessage('Address added successfully')
            }

            // Reset form
            setAddressFormData({
                firstLine: '',
                secondLine: '',
                pincode: '',
                city: '',
                state: ''
            })
            setSelectedAddress(null)
            setShowAddressForm(false)
        } catch (err) {
            console.error('Error submitting address:', err)
            setAddressFormError(err instanceof Error ? err.message : 'Failed to save address')
        } finally {
            setAddressSubmitting(false)
        }
    }

    // Handle editing an address
    const handleEditAddress = (address: Address) => {
        setSelectedAddress(address)
        setAddressFormData({
            firstLine: address.address.firstLine,
            secondLine: address.address.secondLine || '',
            pincode: address.address.pincode.toString(),
            city: address.address.city,
            state: address.address.state
        })
        setShowAddressForm(true)
    }

    // Handle deleting an address
    const initiateDeleteAddress = (addressId: string) => {
        setAddressToDelete(addressId)
        setShowDeleteConfirm(true)
    }

    // Actual delete function
    const confirmDeleteAddress = async () => {
        if (!addressToDelete) return

        try {
            setAddressFormError(null)
            setAddressSuccessMessage(null)

            const response = await fetch('http://localhost:3000/api/address', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ addressId: addressToDelete })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to delete address: ${response.status}`)
            }

            // Remove address from list
            setAddresses((prev) => prev.filter((addr) => addr._id !== addressToDelete))
            setAddressSuccessMessage('Address deleted successfully')

            // Close form if deleting the address being edited
            if (selectedAddress && selectedAddress._id === addressToDelete) {
                setSelectedAddress(null)
                setShowAddressForm(false)
            }
        } catch (err) {
            console.error('Error deleting address:', err)
            setAddressFormError(err instanceof Error ? err.message : 'Failed to delete address')
        } finally {
            // Close the confirmation modal
            setShowDeleteConfirm(false)
            setAddressToDelete(null)
        }
    }

    // Add a function to set an address as default
    const handleSetDefaultAddress = async (addressId: string) => {
        try {
            setAddressFormError(null)
            setAddressSuccessMessage(null)

            const response = await fetch('http://localhost:3000/api/address', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    addressId,
                    address: addresses.find((addr) => addr._id === addressId)?.address,
                    default: true
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to set default address: ${response.status}`)
            }

            const result = await response.json()

            // Update addresses in state to reflect new default
            setAddresses((prev) =>
                prev.map((addr) => ({
                    ...addr,
                    default: addr._id === addressId
                }))
            )

            setAddressSuccessMessage('Default address updated successfully')
        } catch (err) {
            console.error('Error setting default address:', err)
            setAddressFormError(err instanceof Error ? err.message : 'Failed to set default address')
        }
    }

    // Add the deleteConfirmation modal to the render section
    const DeleteConfirmationModal = () => {
        if (!showDeleteConfirm) return null

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1001
                }}
            >
                <div
                    style={{
                        backgroundColor: '#121212',
                        borderRadius: '0.5rem',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                        border: '1px solid #333'
                    }}
                >
                    <h3
                        style={{
                            fontSize: '1.25rem',
                            color: '#f9fafb',
                            marginBottom: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        Delete Address
                    </h3>

                    <p
                        style={{
                            color: '#d1d5db',
                            marginBottom: '1.5rem'
                        }}
                    >
                        Are you sure you want to delete this address? This action cannot be undone.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                        }}
                    >
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(false)
                                setAddressToDelete(null)
                            }}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#d1d5db',
                                border: '1px solid #333',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteAddress}
                            style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )
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

                        {/* Navigation tabs */}
                        <div
                            className={styles.tabsContainer}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '2rem',
                                borderBottom: '1px solid #333'
                            }}
                        >
                            <button
                                className={`${styles.tabButton} ${activeSection === 'profile' ? styles.activeTab : ''}`}
                                onClick={() => setActiveSection('profile')}
                                style={{
                                    padding: '1rem 2rem',
                                    margin: '0 0.5rem',
                                    background: 'transparent',
                                    color: activeSection === 'profile' ? '#22c55e' : '#9ca3af',
                                    border: 'none',
                                    borderBottom: activeSection === 'profile' ? '2px solid #22c55e' : 'none',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Profile
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeSection === 'addresses' ? styles.activeTab : ''}`}
                                onClick={() => setActiveSection('addresses')}
                                style={{
                                    padding: '1rem 2rem',
                                    margin: '0 0.5rem',
                                    background: 'transparent',
                                    color: activeSection === 'addresses' ? '#22c55e' : '#9ca3af',
                                    border: 'none',
                                    borderBottom: activeSection === 'addresses' ? '2px solid #22c55e' : 'none',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Addresses
                            </button>
                        </div>

                        {/* Profile Section */}
                        {activeSection === 'profile' && (
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
                                            Profile Picture{' '}
                                            {userData?.profile_picture && '(Leave empty to keep current)'}
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
                                                    Confirm New Password{' '}
                                                    <span className={styles.requiredIndicator}>*</span>
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
                        )}

                        {/* Addresses Section */}
                        {activeSection === 'addresses' && (
                            <div className={styles.formContainer}>
                                {addressFormError && <div className={styles.errorMessage}>{addressFormError}</div>}
                                {addressSuccessMessage && (
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
                                        {addressSuccessMessage}
                                    </div>
                                )}

                                {!showAddressForm ? (
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1.5rem'
                                            }}
                                        >
                                            <h2 style={{ fontSize: '1.5rem', color: '#f9fafb', fontWeight: '600' }}>
                                                Your Addresses
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setSelectedAddress(null)
                                                    setAddressFormData({
                                                        firstLine: '',
                                                        secondLine: '',
                                                        pincode: '',
                                                        city: '',
                                                        state: ''
                                                    })
                                                    setShowAddressForm(true)
                                                }}
                                                className={styles.button}
                                            >
                                                Add New Address
                                            </button>
                                        </div>

                                        {addresses.length === 0 ? (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '3rem 0',
                                                    backgroundColor: '#121212',
                                                    borderRadius: '0.5rem',
                                                    border: '1px dashed #333'
                                                }}
                                            >
                                                <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                                                    You don't have any saved addresses yet.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setShowAddressForm(true)
                                                        setSelectedAddress(null)
                                                    }}
                                                    className={styles.button}
                                                >
                                                    Add Your First Address
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                                    gap: '1rem'
                                                }}
                                            >
                                                {addresses.map((address) => (
                                                    <div
                                                        key={address._id}
                                                        style={{
                                                            backgroundColor: '#121212',
                                                            borderRadius: '0.5rem',
                                                            padding: '1.5rem',
                                                            border: address.default
                                                                ? '2px solid #22c55e'
                                                                : '1px solid #333',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {address.default && (
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '0.75rem',
                                                                    right: '0.75rem',
                                                                    backgroundColor: '#22c55e',
                                                                    color: 'white',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                Default
                                                            </span>
                                                        )}

                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <p
                                                                style={{
                                                                    color: '#f9fafb',
                                                                    fontWeight: '600',
                                                                    marginBottom: '0.5rem'
                                                                }}
                                                            >
                                                                {address.address.firstLine}
                                                            </p>
                                                            {address.address.secondLine && (
                                                                <p style={{ color: '#9ca3af' }}>
                                                                    {address.address.secondLine}
                                                                </p>
                                                            )}
                                                            <p style={{ color: '#9ca3af' }}>
                                                                {address.address.city}, {address.address.state} -{' '}
                                                                {address.address.pincode}
                                                            </p>
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: '0.75rem',
                                                                marginTop: '1rem'
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() => handleEditAddress(address)}
                                                                style={{
                                                                    backgroundColor: 'transparent',
                                                                    color: '#22c55e',
                                                                    border: '1px solid #22c55e',
                                                                    borderRadius: '0.375rem',
                                                                    padding: '0.5rem 0.75rem',
                                                                    fontSize: '0.875rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                            {!address.default && (
                                                                <button
                                                                    onClick={() => handleSetDefaultAddress(address._id)}
                                                                    style={{
                                                                        backgroundColor: 'transparent',
                                                                        color: '#3b82f6',
                                                                        border: '1px solid #3b82f6',
                                                                        borderRadius: '0.375rem',
                                                                        padding: '0.5rem 0.75rem',
                                                                        fontSize: '0.875rem',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Set Default
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => initiateDeleteAddress(address._id)}
                                                                style={{
                                                                    backgroundColor: 'transparent',
                                                                    color: '#ef4444',
                                                                    border: '1px solid #ef4444',
                                                                    borderRadius: '0.375rem',
                                                                    padding: '0.5rem 0.75rem',
                                                                    fontSize: '0.875rem',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h2
                                            style={{
                                                fontSize: '1.5rem',
                                                color: '#f9fafb',
                                                fontWeight: '600',
                                                marginBottom: '1.5rem'
                                            }}
                                        >
                                            {selectedAddress ? 'Edit Address' : 'Add New Address'}
                                        </h2>

                                        <form onSubmit={handleAddressSubmit}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor='firstLine' className={styles.formLabel}>
                                                    Address Line 1 <span className={styles.requiredIndicator}>*</span>
                                                </label>
                                                <input
                                                    type='text'
                                                    id='firstLine'
                                                    name='firstLine'
                                                    value={addressFormData.firstLine}
                                                    onChange={handleAddressInputChange}
                                                    required
                                                    className={styles.textInput}
                                                    placeholder='Street address, P.O. box, company name'
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor='secondLine' className={styles.formLabel}>
                                                    Address Line 2
                                                </label>
                                                <input
                                                    type='text'
                                                    id='secondLine'
                                                    name='secondLine'
                                                    value={addressFormData.secondLine}
                                                    onChange={handleAddressInputChange}
                                                    className={styles.textInput}
                                                    placeholder='Apartment, suite, unit, building, floor, etc.'
                                                />
                                            </div>

                                            <div className={styles.formRow} style={{ display: 'flex', gap: '1rem' }}>
                                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                                    <label htmlFor='city' className={styles.formLabel}>
                                                        City <span className={styles.requiredIndicator}>*</span>
                                                    </label>
                                                    <input
                                                        type='text'
                                                        id='city'
                                                        name='city'
                                                        value={addressFormData.city}
                                                        onChange={handleAddressInputChange}
                                                        required
                                                        className={styles.textInput}
                                                        placeholder='City'
                                                    />
                                                </div>
                                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                                    <label htmlFor='state' className={styles.formLabel}>
                                                        State <span className={styles.requiredIndicator}>*</span>
                                                    </label>
                                                    <input
                                                        type='text'
                                                        id='state'
                                                        name='state'
                                                        value={addressFormData.state}
                                                        onChange={handleAddressInputChange}
                                                        required
                                                        className={styles.textInput}
                                                        placeholder='State'
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor='pincode' className={styles.formLabel}>
                                                    PIN Code <span className={styles.requiredIndicator}>*</span>
                                                </label>
                                                <input
                                                    type='text'
                                                    id='pincode'
                                                    name='pincode'
                                                    value={addressFormData.pincode}
                                                    onChange={handleAddressInputChange}
                                                    required
                                                    className={styles.textInput}
                                                    placeholder='PIN Code'
                                                    pattern='[0-9]*'
                                                    maxLength={6}
                                                />
                                            </div>

                                            <div className={styles.formActions}>
                                                <button
                                                    type='submit'
                                                    disabled={addressSubmitting}
                                                    className={styles.submitButton}
                                                >
                                                    {addressSubmitting ? (
                                                        <div className={styles.loadingContainer}>
                                                            <div className={styles.loadingSpinner}></div>
                                                            {selectedAddress
                                                                ? 'Updating Address...'
                                                                : 'Adding Address...'}
                                                        </div>
                                                    ) : selectedAddress ? (
                                                        'Update Address'
                                                    ) : (
                                                        'Add Address'
                                                    )}
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setShowAddressForm(false)}
                                                    className={styles.cancelButton}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            {showDeleteConfirm && <DeleteConfirmationModal />}
        </Wrapper>
    )
}

export default UserProfilePage
