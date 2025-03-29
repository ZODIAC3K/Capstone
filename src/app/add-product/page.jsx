'use client'
import React, { useState, useEffect } from 'react'
import ProductCustomizeButton from '../components/ProductCustomizeButton'
import styles from './styles.module.css'

export default function AddProduct() {
    const [result, setResult] = useState(null)
    const [categories, setCategories] = useState([])
    const [models, setModels] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        price_amount: '',
        price_currency: 'INR'
        // No more shaderType in initial state, will be determined by customization
    })

    const [formComplete, setFormComplete] = useState(false)

    // Add a new state for tracking save operation
    const [isSaving, setIsSaving] = useState(false)

    // Fetch categories and models on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true)
            try {
                // Try to fetch from API
                const response = await fetch('http://localhost:3000/api/category', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // Add a reasonable timeout
                    signal: AbortSignal.timeout(5000)
                })

                if (!response.ok) {
                    console.warn(`API returned status: ${response.status}`)
                    throw new Error(`API error: ${response.status}`)
                }

                const data = await response.json()
                setCategories(data.categories || [])
            } catch (err) {
                console.error('Error fetching categories:', err)
                setError(err.message)

                // Fall back to hardcoded categories for development
                console.log('Using fallback categories for development')
                setCategories([
                    {
                        _id: '67e6768061f43a6bd033d39f',
                        category_name: 'T-Shirt',
                        createdAt: '2025-03-28T10:14:24.678Z',
                        updatedAt: '2025-03-28T10:14:24.678Z',
                        __v: 0
                    },
                    {
                        _id: '67e676aa61f43a6bd033d3a5',
                        category_name: 'Shirt',
                        createdAt: '2025-03-28T10:15:06.203Z',
                        updatedAt: '2025-03-28T10:15:06.203Z',
                        __v: 0
                    },
                    {
                        _id: 'dev-sweater-id',
                        category_name: 'Sweater',
                        createdAt: '2025-03-28T10:15:06.203Z',
                        updatedAt: '2025-03-28T10:15:06.203Z',
                        __v: 0
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
                    console.warn(`API returned status: ${response.status}`)
                    throw new Error(`API error: ${response.status}`)
                }

                const data = await response.json()
                if (data.success && Array.isArray(data.data)) {
                    console.log('Fetched models:', data.data)
                    setModels(data.data)
                }
            } catch (err) {
                console.error('Error fetching models:', err)
                // Use hardcoded fallback if needed
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
                    },
                    {
                        _id: '67e344e2d001c2fc0ec71120',
                        name: 'pant'
                    }
                ])
            }
        }

        fetchCategories()
        fetchModels()
    }, [])

    // Handle form input changes
    const handleInputChange = (e) => {
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

    const handleSubmit = (e) => {
        e.preventDefault()
        // Form is validated, user can now customize product
        console.log('Form data submitted:', formData)
    }

    // Action Buttons
    const getModelIdFromType = (modelType) => {
        // Find the model with the matching name in our models array
        const model = models.find((m) => m.name === modelType)
        return model ? model._id : '67e34283d001c2fc0ec7110c' // Default to shirt if not found
    }

    const handleCustomization = (data) => {
        console.log('Customization data:', data)

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

        console.log('Determined shader type:', shaderType)

        // Combine form data with customization data including determined shader type
        const completeProductData = {
            ...formData,
            ...data,
            shaderType
        }

        console.log('Complete product data:', completeProductData)
        setResult({
            ...data,
            shaderType
        })
    }

    // Custom component for the ProductCustomizeButton with controlled styling
    const CustomizeButtonWrapper = ({ onCustomizationComplete }) => {
        return (
            <div className={styles.buttonWrapper}>
                <ProductCustomizeButton
                    productId='new-product'
                    onCustomizationComplete={onCustomizationComplete}
                    customClass={styles.primaryButton}
                />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                {!result ? (
                    <div>
                        <div className={styles.header}>
                            <h2 className={styles.headerTitle}>ADD NEW PRODUCT</h2>
                        </div>
                        <div className={styles.formContent}>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    {/* Title */}
                                    <label htmlFor='title' className={styles.label}>
                                        Product Title<span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        name='title'
                                        id='title'
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder='Enter product title'
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    {/* Category Dropdown */}
                                    <label htmlFor='category_id' className={styles.label}>
                                        Category<span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <select
                                        name='category_id'
                                        id='category_id'
                                        required
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        className={styles.select}
                                    >
                                        <option value=''>Select a category</option>
                                        {isLoading ? (
                                            <option disabled>Loading categories...</option>
                                        ) : error ? (
                                            <option disabled>Error loading categories</option>
                                        ) : (
                                            categories.map((category) => (
                                                <option key={category._id} value={category._id}>
                                                    {category.category_name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    {/* Price Amount */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor='price_amount' className={styles.label}>
                                            Price<span className={styles.requiredAsterisk}>*</span>
                                        </label>
                                        <div className={styles.priceInputContainer}>
                                            <div className={styles.currencySymbol}>₹</div>
                                            <input
                                                type='number'
                                                name='price_amount'
                                                id='price_amount'
                                                required
                                                min='0'
                                                step='0.01'
                                                value={formData.price_amount}
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => {
                                                    // Prevent non-numeric keys (allow only numbers, backspace, tab, delete, arrows)
                                                    const allowedKeys = [
                                                        'Backspace',
                                                        'Tab',
                                                        'Delete',
                                                        'ArrowLeft',
                                                        'ArrowRight',
                                                        'ArrowUp',
                                                        'ArrowDown',
                                                        '.'
                                                    ]
                                                    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                                        e.preventDefault()
                                                    }

                                                    // Only allow one decimal point
                                                    if (e.key === '.' && formData.price_amount.includes('.')) {
                                                        e.preventDefault()
                                                    }
                                                }}
                                                className={`${styles.input} ${styles.priceInput}`}
                                                placeholder='0.00'
                                            />
                                        </div>
                                    </div>

                                    {/* Currency */}
                                    <div className={styles.formGroup}>
                                        <label htmlFor='price_currency' className={styles.label}>
                                            Currency
                                        </label>
                                        <select
                                            name='price_currency'
                                            id='price_currency'
                                            value={formData.price_currency}
                                            onChange={handleInputChange}
                                            className={styles.select}
                                        >
                                            <option value='INR'>INR</option>
                                            <option value='USD'>USD</option>
                                            <option value='EUR'>EUR</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    {/* Description - Full width */}
                                    <label htmlFor='description' className={styles.label}>
                                        Description<span className={styles.requiredAsterisk}>*</span>
                                    </label>
                                    <textarea
                                        name='description'
                                        id='description'
                                        required
                                        rows='4'
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className={styles.textarea}
                                        placeholder='Enter product description'
                                    ></textarea>
                                </div>
                            </form>

                            <div className={styles.buttonsContainer}>
                                <div className={formComplete ? '' : styles.disabled}>
                                    {formComplete ? (
                                        <CustomizeButtonWrapper onCustomizationComplete={handleCustomization} />
                                    ) : (
                                        <button disabled className={`${styles.button} ${styles.secondaryButton}`}>
                                            Complete Form to Design Product
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!formComplete && (
                                <p className={styles.errorMessage}>Please fill in all required fields to continue</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.previewContainer}>
                        <div className={styles.previewHeader}>
                            <h2 className={styles.previewTitle}>Product Preview</h2>
                            <div className={styles.modelType}>
                                {result.modelType.charAt(0).toUpperCase() + result.modelType.slice(1)}
                            </div>
                        </div>

                        <div className={styles.previewGrid}>
                            {/* Product Info */}
                            <div className={styles.infoCard}>
                                <h3 className={styles.infoTitle}>Product Information</h3>
                                <div className={styles.infoContent}>
                                    <div className={styles.infoItem}>
                                        <h4>Title</h4>
                                        <p className={styles.infoValue}>{formData.title}</p>
                                    </div>

                                    <div className={styles.flexRow}>
                                        <div className={styles.infoItem}>
                                            <h4>Price</h4>
                                            <p className={styles.infoValue}>
                                                {formData.price_currency === 'INR'
                                                    ? '₹'
                                                    : formData.price_currency === 'USD'
                                                      ? '$'
                                                      : '€'}
                                                {formData.price_amount}
                                            </p>
                                        </div>

                                        <div className={styles.infoItem}>
                                            <h4>Category</h4>
                                            <p className={styles.infoValue}>
                                                {categories.find((c) => c._id === formData.category_id)
                                                    ?.category_name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <h4>Shader Type</h4>
                                        <div className={styles.tagItem}>
                                            {result.shaderType === 'both' ? 'Full & Partial Body' : result.shaderType}
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <h4>Description</h4>
                                        <p className={styles.description}>{formData.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Display */}
                            <div className={styles.productDisplay}>
                                <div className={styles.productImageContainer}>
                                    {result.productImage ? (
                                        <div className={styles.imageWrapper}>
                                            <img
                                                src={result.productImage}
                                                alt='Customized product'
                                                className={styles.productImage}
                                            />
                                            <div className={styles.colorTag}>
                                                <div
                                                    className={styles.colorSwatch}
                                                    style={{ backgroundColor: result.color }}
                                                ></div>
                                                {result.color}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={styles.noImageText}>No product image available</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.shaderCard}>
                            <h3 className={styles.infoTitle}>Shader Preview</h3>
                            <div className={styles.shaderContainer}>
                                {result.shaderImage ? (
                                    <img src={result.shaderImage} alt='Shader' className={styles.shaderImage} />
                                ) : (
                                    <div className={styles.imageWrapper}>
                                        <span className={styles.noImageText}>No shader image available</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.actionButtons}>
                            <button
                                onClick={async () => {
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

                                        // Get the correct model_id based on the model type from the customization
                                        const modelId = getModelIdFromType(result.modelType)
                                        productFormData.append('model_id', modelId)
                                        console.log(`Using model_id ${modelId} for model type ${result.modelType}`)

                                        // Convert the base64 images to Blob objects
                                        // For the shader image
                                        if (result.shaderImage) {
                                            const shaderBlob = await fetch(result.shaderImage).then((r) => r.blob())
                                            productFormData.append('shader', shaderBlob, 'shader.png')
                                        }

                                        // For the product image
                                        if (result.productImage) {
                                            const productBlob = await fetch(result.productImage).then((r) => r.blob())
                                            productFormData.append('image', productBlob, 'product.png')
                                        }

                                        // Send data to the API
                                        const response = await fetch('http://localhost:3000/api/product', {
                                            method: 'POST',
                                            body: productFormData,
                                            credentials: 'include' // Include cookies for authentication
                                        })

                                        if (!response.ok) {
                                            throw new Error(`API error: ${response.status}`)
                                        }

                                        const data = await response.json()
                                        console.log('Product saved successfully:', data)

                                        // Redirect to creator profile page
                                        window.location.href = '/creator-profile'
                                    } catch (error) {
                                        // Set saving state to false on error
                                        setIsSaving(false)
                                        console.error('Error saving product:', error)
                                        alert(`Failed to save product: ${error.message}`)
                                    }
                                }}
                                disabled={isSaving}
                                className={`${styles.actionButton} ${styles.primaryButton}`}
                            >
                                {isSaving ? (
                                    <div className={styles.loadingSpinner}>
                                        <div className={styles.spinner}></div>
                                    </div>
                                ) : (
                                    'Save Product'
                                )}
                            </button>

                            <button
                                onClick={() => setResult(null)}
                                disabled={isSaving}
                                className={`${styles.actionButton} ${styles.secondaryButton}`}
                            >
                                Edit Details
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// since other models are not working we can hard code the model "_id"
// everything else will be picked dynamically and put into the db like shader image and product image, price, title, description and user/ creator details.
// just need to update the current logic and once the product is created, we can focus on buying and selling.
