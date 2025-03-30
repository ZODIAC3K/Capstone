'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import BreadcrumbArea from '../components/breadcrumb/breadcrumb-area'
import brd_bg from '@/assets/img/bg/breadcrumb_bg01.jpg'
import brd_img from '@/assets/img/team/breadcrumb_team.png'
import TeamDetailsArea from '../components/team/team-details-area'
import TeamArea from '../components/team/team-area'
import BrandArea from '../components/brand/brand-area'
import { mockCreatorData } from './mock-data'
// Import the CSS module
import styles from './styles/CreatorProfile.module.css'
import ProductCustomizeButton from '../components/ProductCustomizeButton'

// We can't use export const metadata with client components
// So we'll need to handle metadata differently

// Remove the Button import and create a simple button component inline
const Button = ({
    children,
    className = '',
    href,
    ...props
}: {
    children: React.ReactNode
    className?: string
    href?: string
    [key: string]: any
}) => {
    const buttonClasses = `${styles.button} ${className}`

    if (href) {
        return (
            <Link href={href} className={buttonClasses} {...props}>
                {children}
            </Link>
        )
    }

    return (
        <button className={buttonClasses} {...props}>
            {children}
        </button>
    )
}

// Define types for creator data
interface CreatorProfilePicture {
    image_url?: string
    data?: string | Buffer
    content_type?: string
}

interface CreatorData {
    _id?: string
    name: string
    bio?: string
    quote?: string
    products?: any[]
    totalSales?: number
    creatorProfilePicture?: CreatorProfilePicture
    creatorCoverImage?: CreatorProfilePicture
}

// Create Creator Form Component
const CreateCreatorForm = ({
    existingData = null,
    onSubmitSuccess = () => {}
}: {
    existingData?: CreatorData | null
    onSubmitSuccess?: () => void
}) => {
    const [formData, setFormData] = useState({
        name: existingData?.name || '',
        bio: existingData?.bio || '',
        quote: existingData?.quote || ''
    })
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'profile') {
                setProfileImage(e.target.files[0])
            } else {
                setCoverImage(e.target.files[0])
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const submitFormData = new FormData()

            // Add text fields
            submitFormData.append('name', formData.name)
            if (formData.bio) submitFormData.append('bio', formData.bio)
            if (formData.quote) submitFormData.append('quote', formData.quote)

            // Add image files if selected
            if (profileImage) submitFormData.append('creatorProfileImage', profileImage)
            if (coverImage) submitFormData.append('creatorCoverImage', coverImage)

            // Set method based on whether we're creating or updating
            const method = existingData ? 'PUT' : 'POST'

            const response = await fetch('http://localhost:3000/api/creator', {
                method,
                body: submitFormData,
                credentials: 'include'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to ${existingData ? 'update' : 'create'} creator profile`)
            }

            // Call success callback
            onSubmitSuccess()

            // Reload the page to show the updated profile
            window.location.reload()
        } catch (err) {
            console.error(`Error ${existingData ? 'updating' : 'creating'} creator profile:`, err)
            setError(
                err instanceof Error
                    ? err.message
                    : `An error occurred while ${existingData ? 'updating' : 'creating'} your profile`
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.formContainer}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor='name' className={styles.formLabel}>
                        Name <span className={styles.requiredIndicator}>*</span>
                    </label>
                    <input
                        type='text'
                        id='name'
                        name='name'
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={styles.textInput}
                        placeholder='Your creator name'
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor='bio' className={styles.formLabel}>
                        Bio
                    </label>
                    <textarea
                        id='bio'
                        name='bio'
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className={styles.textArea}
                        placeholder='Tell us about yourself'
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor='quote' className={styles.formLabel}>
                        Quote
                    </label>
                    <input
                        type='text'
                        id='quote'
                        name='quote'
                        value={formData.quote}
                        onChange={handleInputChange}
                        className={styles.textInput}
                        placeholder='A memorable quote'
                    />
                </div>

                <div className={styles.fileInputWrapper}>
                    <label htmlFor='profileImage' className={styles.formLabel}>
                        Profile Image {existingData?.creatorProfilePicture && '(Leave empty to keep current)'}
                    </label>
                    <div className='relative'>
                        <input
                            type='file'
                            id='profileImage'
                            accept='image/*'
                            onChange={(e) => handleFileChange(e, 'profile')}
                            className={styles.fileInput}
                        />
                        <div className={styles.fileInputDisplay}>
                            <span>{profileImage ? profileImage.name : 'Choose file'}</span>
                            <span className={styles.browseButton}>Browse</span>
                        </div>
                    </div>
                    {profileImage && <p className={styles.fileSelected}>File selected</p>}
                </div>

                <div className={styles.fileInputWrapper}>
                    <label htmlFor='coverImage' className={styles.formLabel}>
                        Cover Image {existingData?.creatorCoverImage && '(Leave empty to keep current)'}
                    </label>
                    <div className='relative'>
                        <input
                            type='file'
                            id='coverImage'
                            accept='image/*'
                            onChange={(e) => handleFileChange(e, 'cover')}
                            className={styles.fileInput}
                        />
                        <div className={styles.fileInputDisplay}>
                            <span>{coverImage ? coverImage.name : 'Choose file'}</span>
                            <span className={styles.browseButton}>Browse</span>
                        </div>
                    </div>
                    {coverImage && <p className={styles.fileSelected}>File selected</p>}
                </div>

                <div className={styles.formActions}>
                    <button type='submit' disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.loadingSpinner}></div>
                                {existingData ? 'Updating Profile...' : 'Creating Profile...'}
                            </div>
                        ) : existingData ? (
                            'Update Profile'
                        ) : (
                            'Create Profile'
                        )}
                    </button>

                    {existingData && (
                        <button type='button' className={styles.cancelButton} onClick={() => onSubmitSuccess()}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}

// Create AddProduct Component
const AddProductComponent = ({
    onClose,
    product = null,
    getImageUrlFn
}: {
    onClose: () => void
    product?: any
    getImageUrlFn: (imageData: any) => string
}) => {
    const [result, setResult] = useState<any>(null)
    const [categories, setCategories] = useState<any[]>([])
    const [models, setModels] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: product?.title || '',
        description: product?.description || '',
        category_id: product?.category_id ? String(product?.category_id) : '',
        price_amount: product?.price?.amount ? String(product?.price?.amount) : '',
        price_currency: product?.price?.currency ? String(product?.price?.currency) : 'INR'
    })

    const [formComplete, setFormComplete] = useState(!!product)
    const [isSaving, setIsSaving] = useState(false)

    // Set initial result if editing an existing product
    useEffect(() => {
        if (product && product.shader_type && product.model_id && models.length > 0) {
            // Find model type from model_id
            const modelType = models.find((m) => m._id === product.model_id)?.name || 'shirt'

            // Set initial result state for existing product
            setResult({
                modelType: modelType,
                shaderType: product.shader_type,
                // Use existing product image if available
                productImage: product.image_id ? getImageUrlFn(product.image_id) : null,
                // Use existing shader image if available
                shaderImage: product.shader_id ? getImageUrlFn(product.shader_id) : null
            })
        }
    }, [product, models, getImageUrlFn])

    // Fetch categories and models on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true)
            try {
                const response = await fetch('http://localhost:3000/api/category', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000)
                })

                if (!response.ok) {
                    console.warn(`API returned status: ${response.status}`)
                    throw new Error(`API error: ${response.status}`)
                }

                const data = await response.json()
                setCategories(data.categories || [])
            } catch (err: any) {
                console.error('Error fetching categories:', err)
                setError(err.message)

                // Fall back to hardcoded categories for development
                setCategories([
                    {
                        _id: '67e6768061f43a6bd033d39f',
                        category_name: 'T-Shirt'
                    },
                    {
                        _id: '67e676aa61f43a6bd033d3a5',
                        category_name: 'Shirt'
                    },
                    {
                        _id: 'dev-sweater-id',
                        category_name: 'Sweater'
                    }
                ])
            } finally {
                setIsLoading(false)
            }
        }

        const fetchModels = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/object', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000)
                })

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`)
                }

                const data = await response.json()
                if (data.success && Array.isArray(data.data)) {
                    setModels(data.data)
                }
            } catch (err) {
                console.error('Error fetching models:', err)
                setModels([
                    {
                        _id: '67e34283d001c2fc0ec7110c',
                        name: 'shirt'
                    },
                    {
                        _id: '67e34343d001c2fc0ec71112',
                        name: 'shirt2'
                    },
                    {
                        _id: '67e34386d001c2fc0ec71114',
                        name: 'sweater'
                    }
                ])
            }
        }

        fetchCategories()
        fetchModels()
    }, [])

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // Validate form and enable customize button
    useEffect(() => {
        const { title, description, category_id, price_amount } = formData
        const isComplete =
            title.trim() !== '' &&
            description.trim() !== '' &&
            category_id !== '' &&
            price_amount.trim() !== '' &&
            !isNaN(Number(price_amount))

        setFormComplete(isComplete)
    }, [formData])

    // Helper functions
    const getModelIdFromType = (modelType: string) => {
        const model = models.find((m) => m.name === modelType)
        return model ? model._id : '67e34283d001c2fc0ec7110c' // Default to shirt if not found
    }

    const handleCustomization = (data: any) => {
        // Determine shader type based on customization data
        let shaderType = 'partial-body' // default

        // Check if both textures are active
        if (data.isLogoTexture && data.isFullTexture) {
            shaderType = 'both'
        } else if (data.isFullTexture === true) {
            shaderType = 'full-body'
        } else if (data.shader && data.shader === data.fullDecal) {
            // If the shader matches the full decal, it's a full-body shader
            shaderType = 'full-body'
        }

        // Set result with determined shader type
        setResult({
            ...data,
            shaderType
        })
    }

    const CustomizeButtonWrapper = ({ onCustomizationComplete }: { onCustomizationComplete: (data: any) => void }) => {
        return (
            <div className={styles.buttonWrapper}>
                <ProductCustomizeButton
                    productId={product?._id || 'new-product'}
                    onCustomizationComplete={onCustomizationComplete}
                    customClass={styles.primaryButton}
                />
            </div>
        )
    }

    const handleSubmitProduct = async () => {
        try {
            // Set saving state to true to show loading animation
            setIsSaving(true)

            // Create FormData object instead of JSON
            const productFormData = new FormData()

            // Add all the form fields to FormData
            productFormData.append('title', formData.title)
            productFormData.append('description', formData.description)
            productFormData.append('category_id', formData.category_id)
            productFormData.append('price_amount', formData.price_amount)
            productFormData.append('price_currency', formData.price_currency)
            productFormData.append('shaderType', result.shaderType)

            // Add product ID to FormData if updating existing product
            if (product && product._id) {
                console.log('Adding product ID to FormData:', product._id)
                productFormData.append('product_id', product._id.toString())
            }

            // Get the correct model_id based on the model type from the customization
            const modelId = getModelIdFromType(result.modelType)
            productFormData.append('model_id', modelId)

            // Convert the base64 images to Blob objects only if they've changed
            // For the shader image
            if (result.shaderImage && (!product || result.shaderImage !== getImageUrlFn(product.shader_id))) {
                const shaderBlob = await fetch(result.shaderImage).then((r) => r.blob())
                productFormData.append('shader', shaderBlob, 'shader.png')
            }

            // For the product image
            if (result.productImage && (!product || result.productImage !== getImageUrlFn(product.image_id))) {
                const productBlob = await fetch(result.productImage).then((r) => r.blob())
                productFormData.append('image', productBlob, 'product.png')
            }

            // Send data to the API
            // Use PATCH for updating, POST for creating new
            const method = product ? 'PATCH' : 'POST'
            const url = 'http://localhost:3000/api/product'

            const response = await fetch(url, {
                method,
                body: productFormData,
                credentials: 'include' // Include cookies for authentication
            })

            // Handle non-OK responses
            if (!response.ok) {
                // Try to get detailed error information from the response
                let errorMessage = `API error: ${response.status}`
                try {
                    const errorData = await response.json()
                    if (errorData.error || errorData.message) {
                        errorMessage = errorData.error || errorData.message
                    }
                } catch (jsonError) {
                    // If we can't parse JSON, stick with the default error message
                    console.error('Error parsing API error response:', jsonError)
                }

                throw new Error(errorMessage)
            }

            const data = await response.json()
            console.log(`Product ${product ? 'updated' : 'saved'} successfully:`, data)

            // Close the form and refresh the page to show the updated product
            onClose()
            window.location.reload()
        } catch (error: any) {
            setIsSaving(false)
            console.error(`Error ${product ? 'updating' : 'saving'} product:`, error)
            alert(`Failed to ${product ? 'update' : 'save'} product: ${error.message}`)
        }
    }

    return (
        <div className={styles.addProductContainer}>
            <div className={styles.formContainer}>
                {!result ? (
                    <div>
                        <div className={styles.header}>
                            <h2 className={styles.pageTitle}>{product ? 'MODIFY PRODUCT' : 'ADD NEW PRODUCT'}</h2>
                            <p className={styles.pageSubtitle}>
                                {product ? 'Update and customize your product' : 'Create and customize your product'}
                            </p>
                        </div>
                        <div className={styles.formContent}>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className={styles.formGroup}>
                                    <label htmlFor='title' className={styles.formLabel}>
                                        Product Title <span className={styles.requiredIndicator}>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='title'
                                        id='title'
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={styles.textInput}
                                        placeholder='Enter product title'
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor='category_id' className={styles.formLabel}>
                                        Category <span className={styles.requiredIndicator}>*</span>
                                    </label>
                                    <select
                                        name='category_id'
                                        id='category_id'
                                        required
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        className={styles.textInput}
                                    >
                                        <option value=''>Select a category</option>
                                        {isLoading ? (
                                            <option disabled>Loading categories...</option>
                                        ) : error ? (
                                            <option disabled>Error loading categories</option>
                                        ) : (
                                            categories.map((category) => (
                                                <option key={category._id} value={String(category._id)}>
                                                    {category.category_name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor='price_amount' className={styles.formLabel}>
                                            Price <span className={styles.requiredIndicator}>*</span>
                                        </label>
                                        <div className={styles.priceInputContainer}>
                                            <input
                                                type='number'
                                                name='price_amount'
                                                id='price_amount'
                                                required
                                                min='0'
                                                step='0.01'
                                                value={formData.price_amount}
                                                onChange={handleInputChange}
                                                className={styles.textInput}
                                                placeholder='₹ Price'
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor='price_currency' className={styles.formLabel}>
                                            Currency
                                        </label>
                                        <select
                                            name='price_currency'
                                            id='price_currency'
                                            value={formData.price_currency}
                                            onChange={handleInputChange}
                                            className={styles.textInput}
                                        >
                                            <option value='INR'>INR</option>
                                            <option value='USD'>USD</option>
                                            <option value='EUR'>EUR</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor='description' className={styles.formLabel}>
                                        Description <span className={styles.requiredIndicator}>*</span>
                                    </label>
                                    <textarea
                                        name='description'
                                        id='description'
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className={styles.textArea}
                                        placeholder='Enter product description'
                                    ></textarea>
                                </div>
                            </form>

                            <div className={styles.buttonsContainer}>
                                {formComplete ? (
                                    <CustomizeButtonWrapper onCustomizationComplete={handleCustomization} />
                                ) : (
                                    <div className={styles.disabled}>
                                        <button disabled className={styles.cancelButton}>
                                            Complete Form to Design Product
                                        </button>
                                    </div>
                                )}
                                <button onClick={onClose} className={styles.cancelButton}>
                                    Cancel
                                </button>
                            </div>

                            {!formComplete && (
                                <p className={styles.errorMessage}>Please fill in all required fields to continue</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.previewContainer}>
                        <div className={styles.previewHeader}>
                            <h2 className={styles.pageTitle}>Product Preview</h2>
                            <div className={styles.modelType}>
                                {result.modelType &&
                                    result.modelType.charAt(0).toUpperCase() + result.modelType.slice(1)}
                            </div>
                        </div>

                        <div className={styles.previewContent}>
                            <div className={styles.previewInfo}>
                                <h3>Product Information</h3>
                                <p>
                                    <strong>Title:</strong> {formData.title}
                                </p>
                                <p>
                                    <strong>Category:</strong>{' '}
                                    {categories.find((cat) => cat._id === formData.category_id)?.category_name ||
                                        'Unknown'}
                                </p>
                                <p>
                                    <strong>Price:</strong> {formData.price_currency} {formData.price_amount}
                                </p>
                                <p>
                                    <strong>Description:</strong> {formData.description}
                                </p>
                            </div>
                            <div className={styles.previewImage}>
                                {result.productImage && (
                                    <img
                                        src={result.productImage}
                                        alt='Product Preview'
                                        className={styles.productPreviewImage}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button onClick={handleSubmitProduct} disabled={isSaving} className={styles.submitButton}>
                                {isSaving ? (
                                    <div className={styles.loadingContainer}>
                                        <div className={styles.loadingSpinner}></div>
                                        {product ? 'Updating Product...' : 'Saving Product...'}
                                    </div>
                                ) : product ? (
                                    'Update Product'
                                ) : (
                                    'Save Product'
                                )}
                            </button>
                            <button onClick={() => setResult(null)} className={styles.cancelButton}>
                                Back to Form
                            </button>
                            <button onClick={onClose} className={styles.cancelButton}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function CreatorProfilePage() {
    const [creator, setCreator] = useState<CreatorData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [useMockData, setUseMockData] = useState(false)
    const [showEditForm, setShowEditForm] = useState(false)
    const [showAddProduct, setShowAddProduct] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    // Memoize the getImageUrl function to avoid re-creation on each render
    const getImageUrl = useCallback((imageData: any) => {
        if (!imageData) return '/placeholder.png'

        try {
            // If imageData has an image_url field (from S3), use it directly
            if (imageData.image_url) {
                return imageData.image_url
            }

            // Legacy support for buffer data if it exists
            // This can be removed once all images are migrated to S3
            if (imageData.data && imageData.content_type) {
                // Convert buffer data to base64
                const base64 =
                    typeof imageData.data === 'string' ? imageData.data : Buffer.from(imageData.data).toString('base64')
                return `data:${imageData.content_type};base64,${base64}`
            }

            // Fallback to placeholder
            return '/placeholder.png'
        } catch (err) {
            console.error('Error processing image:', err)
            return '/placeholder.png'
        }
    }, [])

    useEffect(() => {
        const fetchCreatorProfile = async () => {
            try {
                setLoading(true)
                console.log('Fetching creator profile...')
                // Try with explicit method and full URL
                const response = await fetch('http://localhost:3000/api/creator', {
                    method: 'GET',
                    credentials: 'include'
                })

                console.log('Response status:', response.status)
                console.log('Response ok:', response.ok)

                if (response.status === 404) {
                    // This is the case when a creator profile doesn't exist yet
                    console.log('Creator profile not found - user needs to create one')
                    setCreator(null) // This will trigger the "No Creator Profile Found" UI
                    setLoading(false)
                    return
                }

                if (!response.ok) {
                    console.error('API error:', response.status)
                    setError('Error: ' + response.status)
                    return
                }

                const result = await response.json()
                console.log('Response received:', result)

                if (!result.success) {
                    setError(result.error || 'Failed to fetch creator profile')
                    return
                }

                setCreator(result.data)
            } catch (err) {
                console.error('Error fetching creator profile:', err)
                setError('An error occurred while fetching the creator profile')
            } finally {
                setLoading(false)
            }
        }

        fetchCreatorProfile()
    }, [])

    // Mock data fallback button handler
    const handleUseMockData = () => {
        console.log('Using mock data as fallback')
        setCreator(mockCreatorData)
        setError(null)
        setUseMockData(true)
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
                            Error Loading Creator Profile
                        </h1>
                        <div className={styles.errorMessage}>{error}</div>
                        <div className='flex space-x-4 justify-center mt-6'>
                            <Button href='/'>Go Back Home</Button>
                            <button onClick={handleUseMockData} className={styles.button}>
                                Use Demo Data
                            </button>
                        </div>
                    </div>
                </div>
            </Wrapper>
        )
    }

    if (!creator) {
        return (
            <Wrapper>
                <Header />
                <main className={styles.pageBackground}>
                    <div className={styles.container}>
                        <div className='py-12 pt-16'>
                            <h1 className={styles.pageTitle}>CREATE YOUR CREATOR PROFILE</h1>
                            <p className={styles.pageSubtitle}>
                                Set up your profile to start creating and selling products
                            </p>
                            <CreateCreatorForm />
                        </div>
                    </div>
                </main>
                <div className={styles.footerSpacing}>
                    <Footer className={styles.customFooter} />
                </div>
            </Wrapper>
        )
    }

    // When in the profile view, show either the edit form, add product form, or the normal profile
    if (showAddProduct && creator) {
        return (
            <Wrapper>
                <Header />
                <main className={styles.pageBackground}>
                    <div className={styles.container}>
                        <div className='py-12 pt-16'>
                            <AddProductComponent
                                onClose={() => {
                                    setShowAddProduct(false)
                                    setSelectedProduct(null)
                                }}
                                product={selectedProduct}
                                getImageUrlFn={getImageUrl}
                            />
                        </div>
                    </div>
                </main>
                <div className={styles.footerSpacing}>
                    <Footer className={styles.customFooter} />
                </div>
            </Wrapper>
        )
    }

    if (showEditForm && creator) {
        return (
            <Wrapper>
                <Header />
                <main className={styles.pageBackground}>
                    <div className={styles.container}>
                        <div className='py-12 pt-16'>
                            <h1 className={styles.pageTitle}>EDIT YOUR CREATOR PROFILE</h1>
                            <p className={styles.pageSubtitle}>Update your profile information</p>
                            <CreateCreatorForm existingData={creator} onSubmitSuccess={() => setShowEditForm(false)} />
                        </div>
                    </div>
                </main>
                <div className={styles.footerSpacing}>
                    <Footer className={styles.customFooter} />
                </div>
            </Wrapper>
        )
    }

    // Get profile and cover image URLs
    const profileImageUrl = creator.creatorProfilePicture
        ? getImageUrl(creator.creatorProfilePicture)
        : '/placeholder.png'

    const coverImageUrl = creator.creatorCoverImage ? getImageUrl(creator.creatorCoverImage) : '/placeholder-cover.png'

    return (
        <Wrapper>
            {/* header start */}
            <Header />
            {/* header end */}

            {/* main area start */}
            <main className='main--area'>
                {/* breadcrumb area start */}
                <div className={styles.breadcrumbWrapper}>
                    <BreadcrumbArea
                        title={creator.name || 'Creator Profile'}
                        subtitle='CREATOR PROFILE'
                        brd_img={profileImageUrl}
                        customButton={{
                            text: 'Add Product',
                            onClick: () => setShowAddProduct(true)
                        }}
                        imageClassName={styles.profileImageStyle}
                    />
                </div>
                {/* breadcrumb area end */}

                {/* team details area - Biography Section */}
                <div className={styles.teamDetailsWrapper}>
                    <TeamDetailsArea
                        bio={creator.bio || 'I am a rockstar.'}
                        quote={
                            creator.quote ||
                            'Jack of all trades, master of none, but oftentimes better than master of one.'
                        }
                        creator={creator.name || 'DXACE'}
                        contentClassName={styles.teamContent}
                        quoteClassName={styles.quoteStyle}
                        citeClassName={styles.citeStyle}
                    />
                </div>

                {/* Products Section */}
                <div className={styles.container}>
                    {/* Creator Stats */}
                    <div className={styles.statsContainer}>
                        <div className={styles.statItem}>
                            <h3 className={styles.statLabel}>Products</h3>
                            <p className={styles.statValue}>{creator.products?.length || 0}</p>
                        </div>
                        <div className={styles.statItem}>
                            <h3 className={styles.statLabel}>Total Sales</h3>
                            <p className={styles.statValue}>₹{creator.totalSales || 0}</p>
                        </div>

                        {/* Edit Profile Button */}
                        <div className='ml-auto'>
                            <Button onClick={() => setShowEditForm(true)}>Edit Profile</Button>
                        </div>
                    </div>

                    {/* Products Section */}
                    {creator.products && creator.products.length > 0 ? (
                        <div className={styles.productsSection}>
                            <h2 className={styles.productsTitle}>My Products</h2>
                            <div className={styles.productsGrid}>
                                {creator.products.map((product: any) => {
                                    const productImageUrl = product.image_id
                                        ? getImageUrl(product.image_id)
                                        : '/placeholder-product.png'

                                    return (
                                        <div key={product._id} className={styles.productCard}>
                                            <div className={styles.productImageContainer}>
                                                <Image
                                                    src={productImageUrl}
                                                    alt={product.title}
                                                    width={400}
                                                    height={400}
                                                    className={styles.productImage}
                                                    priority
                                                />
                                            </div>
                                            <div className={styles.productInfo}>
                                                <h3 className={styles.productTitle}>{product.title}</h3>
                                                <p className={styles.productDescription}>{product.description}</p>
                                                <div className={styles.productMeta}>
                                                    <span className={styles.productPrice}>
                                                        ₹{product.price?.amount || 0}
                                                    </span>
                                                    <span className={styles.productSales}>
                                                        {product.sales_count || 0} sales
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.productActions}>
                                                <Button
                                                    onClick={() => {
                                                        setSelectedProduct(product)
                                                        setShowAddProduct(true)
                                                    }}
                                                >
                                                    Modify
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <h2 className={styles.emptyStateTitle}>No Products Yet</h2>
                            <p className={styles.emptyStateText}>
                                Start creating and selling your digital assets today!
                            </p>
                            <Button onClick={() => setShowAddProduct(true)}>Create Your First Product</Button>
                        </div>
                    )}
                </div>
            </main>
            {/* main area end */}

            {/* footer start */}
            <div className={styles.footerSpacing}>
                <Footer className={styles.customFooter} />
            </div>
            {/* footer end */}
        </Wrapper>
    )
}
