'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

interface Product {
    _id: string
    title: string
    description: string
    price: {
        amount: number
        currency: string
    }
    image_id: {
        _id: string
        image_url: string
    }
    creator_id: {
        name: string
        _id: string
    }
    category_id: {
        _id: string
        category_name: string
    }[]
    shader_id?: {
        _id: string
        shaderType: string
        shaderImage: {
            _id: string
            image_url: string
        }
    }
    rating?: number
    review_count?: number
    sales_count?: number
}

interface Review {
    _id: string
    user_id: {
        _id: string
        fname: string
        lname: string
        email: string
        profile_img?: string
    }
    product_id: string
    rating: number
    title: string
    comment: string
    createdAt: string
    updatedAt: string
}

interface ReviewsStats {
    averageRating: number
    reviewCounts: {
        1: number
        2: number
        3: number
        4: number
        5: number
    }
}

const ShopDetailsArea = ({ product }: { product: Product }) => {
    const [quantity, setQuantity] = useState<number>(1)
    const [activeTab, setActiveTab] = useState<string>('description')
    const [selectedImage, setSelectedImage] = useState<string>(product.image_id.image_url)
    const [isZoomed, setIsZoomed] = useState<boolean>(false)
    const [addingToCart, setAddingToCart] = useState(false)
    const [reviews, setReviews] = useState<Review[]>([])
    const [reviewStats, setReviewStats] = useState<ReviewsStats | null>(null)
    const [reviewsLoading, setReviewsLoading] = useState(false)
    const [reviewsPage, setReviewsPage] = useState(1)
    const [reviewsTotal, setReviewsTotal] = useState(0)
    const reviewsPerPage = 5

    // Fetch reviews
    const fetchReviews = async (page = 1) => {
        try {
            setReviewsLoading(true)
            const response = await fetch(`/api/review?productId=${product._id}&page=${page}&limit=${reviewsPerPage}`)

            if (!response.ok) {
                throw new Error('Failed to fetch reviews')
            }

            const data = await response.json()

            if (data.success) {
                setReviews(page === 1 ? data.data.reviews : [...reviews, ...data.data.reviews])
                setReviewsPage(page)
                setReviewsTotal(data.data.pagination.total)

                if (data.data.stats) {
                    setReviewStats(data.data.stats)
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setReviewsLoading(false)
        }
    }

    // Load more reviews
    const handleLoadMoreReviews = () => {
        if (!reviewsLoading && reviews.length < reviewsTotal) {
            fetchReviews(reviewsPage + 1)
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Handle increment/decrement
    const handleQuantityChange = (action: string) => {
        if (action === 'inc') {
            setQuantity((prev) => prev + 1)
        } else if (action === 'dec' && quantity > 1) {
            setQuantity((prev) => prev - 1)
        }
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
    }

    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl)
    }

    const toggleZoom = () => {
        setIsZoomed(!isZoomed)
    }

    const handleAddToCart = async () => {
        try {
            setAddingToCart(true)

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: product._id,
                    quantity: quantity
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.success('Product added to cart!', {
                    position: 'top-right',
                    autoClose: 3000
                })
            } else {
                toast.error(data.error || 'Failed to add product to cart', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            toast.error('An error occurred while adding to cart', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setAddingToCart(false)
        }
    }

    // Fetch reviews when tab changes to reviews
    useEffect(() => {
        if (activeTab === 'reviews' && reviews.length === 0) {
            fetchReviews()
        }
    }, [activeTab])

    return (
        <section
            className='product-details-section py-16'
            style={{ background: '#121212', marginTop: '40px', padding: '0px 0px 40px 40px' }}
        >
            <div className='container'>
                <div className='bg-black text-white p-4 mb-4 rounded-3' style={{ borderLeft: '4px solid #22c55e' }}>
                    <h1 className='product-title fs-2 mb-0'>{product.title}</h1>
                </div>

                <div className='row g-4'>
                    {/* Left Column - Images */}
                    <div className='col-lg-6'>
                        <div className='product-images-container'>
                            <div
                                className='main-image-container position-relative bg-black rounded-4 overflow-hidden mb-3'
                                style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                                onClick={toggleZoom}
                            >
                                <Image
                                    src={selectedImage}
                                    alt={product.title}
                                    width={800}
                                    height={800}
                                    priority
                                    className={`main-product-image ${isZoomed ? 'zoomed' : ''}`}
                                    style={{
                                        width: '100%',
                                        height: isZoomed ? '600px' : '400px',
                                        objectFit: isZoomed ? 'contain' : 'cover',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                                <div className='image-overlay position-absolute bottom-0 start-0 p-3 text-white bg-black bg-opacity-75 w-100'>
                                    <small>Click to {isZoomed ? 'shrink' : 'zoom'}</small>
                                </div>
                            </div>

                            <div className='thumbnails-container d-flex gap-2 justify-content-start'>
                                <div
                                    className={`thumbnail-item rounded-3 overflow-hidden ${
                                        selectedImage === product.image_id.image_url ? 'border border-success' : ''
                                    }`}
                                    onClick={() => handleImageClick(product.image_id.image_url)}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        cursor: 'pointer',
                                        background: '#1E1E1E'
                                    }}
                                >
                                    <Image
                                        src={product.image_id.image_url}
                                        alt='Product thumbnail'
                                        width={80}
                                        height={80}
                                        className='w-100 h-100'
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>

                                {product.shader_id && (
                                    <div
                                        className={`thumbnail-item rounded-3 overflow-hidden ${
                                            selectedImage === product.shader_id.shaderImage.image_url
                                                ? 'border border-success'
                                                : ''
                                        }`}
                                        onClick={() => handleImageClick(product.shader_id!.shaderImage.image_url)}
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            cursor: 'pointer',
                                            background: '#1E1E1E'
                                        }}
                                    >
                                        <Image
                                            src={product.shader_id.shaderImage.image_url}
                                            alt='Shader thumbnail'
                                            width={80}
                                            height={80}
                                            className='w-100 h-100'
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className='col-lg-6'>
                        <div
                            className='product-details-info p-4 rounded-4 h-100'
                            style={{ background: '#1E1E1E', color: '#f5f5f5' }}
                        >
                            <div className='d-flex justify-content-between align-items-center mb-3'>
                                <div className='product-rating'>
                                    {[...Array(5)].map((_, i) => (
                                        <i
                                            key={i}
                                            className='fas fa-star'
                                            style={{
                                                color: i < Math.round(product.rating || 0) ? '#22c55e' : '#444444',
                                                fontSize: '18px',
                                                marginRight: '2px'
                                            }}
                                        ></i>
                                    ))}
                                    <span style={{ color: '#888888', fontSize: '14px', marginLeft: '6px' }}>
                                        ({product.rating ? product.rating.toFixed(1) : '0'})
                                    </span>
                                </div>
                            </div>

                            <div className='price-container mb-4'>
                                <h2 className='product-price fw-bold' style={{ color: '#22c55e' }}>
                                    {product.price.currency} {product.price.amount.toFixed(2)}
                                </h2>
                            </div>

                            <div className='product-meta mb-4'>
                                <div className='d-flex flex-column gap-2'>
                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px' }}>Creator:</span>
                                        <Link
                                            href={`/shop?creator=${product.creator_id._id}`}
                                            className='text-decoration-none'
                                            style={{ color: '#22c55e', fontWeight: 500 }}
                                        >
                                            {product.creator_id.name}
                                        </Link>
                                    </div>

                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px' }}>Sales:</span>
                                        <span style={{ color: '#f5f5f5' }}>{product.sales_count || 0}</span>
                                    </div>

                                    {product.shader_id && (
                                        <div className='meta-item d-flex'>
                                            <span style={{ color: '#888888', width: '80px' }}>Shader:</span>
                                            <span style={{ color: '#f5f5f5' }}>{product.shader_id.shaderType}</span>
                                        </div>
                                    )}

                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px', marginTop: '4px' }}>
                                            Categories:
                                        </span>
                                        <div
                                            className='d-flex gap-2 flex-wrap'
                                            style={{ flex: 1, marginTop: '2px', marginLeft: '30px' }}
                                        >
                                            {product.category_id.map((category) => (
                                                <Link
                                                    key={category._id}
                                                    href={`/shop?category=${category._id}`}
                                                    className='badge text-decoration-none py-2 px-3 mb-1'
                                                    style={{ background: '#333333', color: '#f5f5f5' }}
                                                >
                                                    {category.category_name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='quantity-container d-flex align-items-center mt-4 mb-4'>
                                <div className='d-flex align-items-center'>
                                    <button
                                        type='button'
                                        onClick={() => handleQuantityChange('dec')}
                                        className='btn btn-sm'
                                        style={{
                                            background: '#333333',
                                            color: '#ffffff',
                                            border: 'none',
                                            width: '36px',
                                            height: '36px'
                                        }}
                                    >
                                        <i className='fas fa-minus'></i>
                                    </button>
                                    <input
                                        type='text'
                                        value={quantity}
                                        readOnly
                                        className='form-control text-center mx-2'
                                        style={{
                                            background: '#333333',
                                            color: '#ffffff',
                                            border: 'none',
                                            width: '50px',
                                            height: '36px'
                                        }}
                                    />
                                    <button
                                        type='button'
                                        onClick={() => handleQuantityChange('inc')}
                                        className='btn btn-sm'
                                        style={{
                                            background: '#333333',
                                            color: '#ffffff',
                                            border: 'none',
                                            width: '36px',
                                            height: '36px'
                                        }}
                                    >
                                        <i className='fas fa-plus'></i>
                                    </button>
                                </div>
                                <button
                                    type='button'
                                    className='btn btn-success ms-3 ps-4 pe-4'
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                    style={{ fontWeight: 600 }}
                                >
                                    {addingToCart ? (
                                        <>
                                            <i className='fas fa-spinner fa-spin me-2'></i>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <i className='fas fa-cart-plus me-2'></i>
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className='share-buttons mt-4 pt-4' style={{ borderTop: '1px solid #333333' }}>
                                <h5 className='fw-bold mb-3' style={{ color: '#f5f5f5' }}>
                                    Share
                                </h5>
                                <div className='d-flex gap-2'>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-facebook-f'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-twitter'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-instagram'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fas fa-link'></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row mt-5'>
                    <div className='col-12'>
                        <div
                            className='additional-details p-4 rounded-4'
                            style={{ background: '#1E1E1E', color: '#f5f5f5' }}
                        >
                            <ul
                                className='nav nav-tabs border-0 mb-4'
                                role='tablist'
                                style={{ borderBottom: '1px solid #333333' }}
                            >
                                <li className='nav-item' role='presentation'>
                                    <button
                                        className={`nav-link ${activeTab === 'description' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('description')}
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTab === 'description'}
                                        style={{
                                            background: activeTab === 'description' ? '#22c55e' : '#1E1E1E',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '4px 4px 0 0',
                                            marginRight: '5px'
                                        }}
                                    >
                                        Description
                                    </button>
                                </li>
                                <li className='nav-item' role='presentation'>
                                    <button
                                        className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('info')}
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTab === 'info'}
                                        style={{
                                            background: activeTab === 'info' ? '#22c55e' : '#1E1E1E',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '4px 4px 0 0'
                                        }}
                                    >
                                        Additional Info
                                    </button>
                                </li>
                                <li className='nav-item' role='presentation'>
                                    <button
                                        className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('reviews')}
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTab === 'reviews'}
                                        style={{
                                            background: activeTab === 'reviews' ? '#22c55e' : '#1E1E1E',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '4px 4px 0 0'
                                        }}
                                    >
                                        Reviews {product.review_count ? `(${product.review_count})` : ''}
                                    </button>
                                </li>
                            </ul>

                            <div className='tab-content'>
                                <div
                                    className={`tab-pane fade ${activeTab === 'description' ? 'show active' : ''}`}
                                    role='tabpanel'
                                    style={{ padding: '20px 10px', color: '#f0f0f0' }}
                                >
                                    <p>{product.description}</p>
                                </div>
                                <div
                                    className={`tab-pane fade ${activeTab === 'info' ? 'show active' : ''}`}
                                    role='tabpanel'
                                    style={{ padding: '20px 10px' }}
                                >
                                    <div className='table-responsive'>
                                        <table
                                            className='table'
                                            style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                            }}
                                        >
                                            <tbody>
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            width: '200px',
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Product ID
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product._id}
                                                    </td>
                                                </tr>
                                                {product.shader_id && (
                                                    <tr>
                                                        <th
                                                            scope='row'
                                                            style={{
                                                                color: '#666666',
                                                                padding: '16px',
                                                                fontWeight: '500',
                                                                borderColor: '#f0f0f0'
                                                            }}
                                                        >
                                                            Shader Type
                                                        </th>
                                                        <td
                                                            style={{
                                                                color: '#333333',
                                                                padding: '16px',
                                                                borderColor: '#f0f0f0'
                                                            }}
                                                        >
                                                            {product.shader_id.shaderType}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Creator
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product.creator_id.name}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Sales
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product.sales_count || 0}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div
                                    className={`tab-pane fade ${activeTab === 'reviews' ? 'show active' : ''}`}
                                    role='tabpanel'
                                    style={{ padding: '20px 10px' }}
                                >
                                    <div className='row mb-4'>
                                        <div className='col-md-4'>
                                            <div className='reviews-summary text-center p-4 bg-black rounded-4'>
                                                <h2 className='display-3 fw-bold text-white mb-0'>
                                                    {reviewStats?.averageRating
                                                        ? reviewStats.averageRating.toFixed(1)
                                                        : product.rating
                                                          ? product.rating.toFixed(1)
                                                          : '0'}
                                                </h2>
                                                <div className='product-rating my-2'>
                                                    {[...Array(5)].map((_, i) => (
                                                        <i
                                                            key={i}
                                                            className='fas fa-star'
                                                            style={{
                                                                color:
                                                                    i <
                                                                    Math.round(
                                                                        reviewStats?.averageRating ||
                                                                            product.rating ||
                                                                            0
                                                                    )
                                                                        ? '#22c55e'
                                                                        : '#444444',
                                                                fontSize: '18px',
                                                                marginRight: '3px'
                                                            }}
                                                        ></i>
                                                    ))}
                                                </div>
                                                <p className='text-light mb-0'>
                                                    Based on {reviewsTotal || product.review_count || 0} reviews
                                                </p>
                                            </div>
                                        </div>

                                        <div className='col-md-8'>
                                            <div className='rating-bars p-4 bg-black rounded-4 h-100'>
                                                {reviewStats &&
                                                    [5, 4, 3, 2, 1].map((star) => {
                                                        const count =
                                                            reviewStats.reviewCounts[
                                                                star as keyof typeof reviewStats.reviewCounts
                                                            ] || 0
                                                        const percentage = reviewsTotal
                                                            ? Math.round((count / reviewsTotal) * 100)
                                                            : 0

                                                        return (
                                                            <div
                                                                key={star}
                                                                className='rating-bar d-flex align-items-center mb-2'
                                                            >
                                                                <div
                                                                    className='stars-label me-2'
                                                                    style={{ width: '80px' }}
                                                                >
                                                                    <span>
                                                                        {star} {star === 1 ? 'star' : 'stars'}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className='progress flex-grow-1 bg-dark'
                                                                    style={{ height: '12px' }}
                                                                >
                                                                    <div
                                                                        className='progress-bar'
                                                                        role='progressbar'
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                            backgroundColor: '#22c55e'
                                                                        }}
                                                                        aria-valuenow={percentage}
                                                                        aria-valuemin={0}
                                                                        aria-valuemax={100}
                                                                    ></div>
                                                                </div>
                                                                <span
                                                                    className='count-label ms-2'
                                                                    style={{ width: '40px' }}
                                                                >
                                                                    {count}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}

                                                {!reviewStats && (
                                                    <div className='text-center text-muted py-4'>
                                                        <p>No rating breakdown available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className='reviews-container'>
                                        <h4 className='mb-4'>Customer Reviews</h4>

                                        {reviewsLoading && reviews.length === 0 ? (
                                            <div className='text-center py-5'>
                                                <div className='spinner-border text-success' role='status'>
                                                    <span className='visually-hidden'>Loading...</span>
                                                </div>
                                                <p className='mt-3 text-light'>Loading reviews...</p>
                                            </div>
                                        ) : reviews.length > 0 ? (
                                            <>
                                                {reviews.map((review) => (
                                                    <div
                                                        key={review._id}
                                                        className='review-item p-4 mb-4 bg-black rounded-4'
                                                    >
                                                        <div className='d-flex justify-content-between align-items-start mb-3'>
                                                            <div className='d-flex align-items-center'>
                                                                <div
                                                                    className='review-avatar rounded-circle overflow-hidden me-3'
                                                                    style={{
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        background: '#333'
                                                                    }}
                                                                >
                                                                    {review.user_id.profile_img ? (
                                                                        <Image
                                                                            src={review.user_id.profile_img}
                                                                            alt={`${review.user_id.fname} ${review.user_id.lname}`}
                                                                            width={48}
                                                                            height={48}
                                                                            style={{
                                                                                objectFit: 'cover',
                                                                                width: '100%',
                                                                                height: '100%'
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className='d-flex align-items-center justify-content-center h-100'
                                                                            style={{
                                                                                background: '#22c55e',
                                                                                color: 'white',
                                                                                fontSize: '18px'
                                                                            }}
                                                                        >
                                                                            {review.user_id.fname.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h5 className='review-author mb-0'>
                                                                        {review.user_id.fname} {review.user_id.lname}
                                                                    </h5>
                                                                    <div className='review-date text-muted small'>
                                                                        {formatDate(review.createdAt)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className='review-rating'>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <i
                                                                        key={i}
                                                                        className='fas fa-star'
                                                                        style={{
                                                                            color:
                                                                                i < review.rating
                                                                                    ? '#22c55e'
                                                                                    : '#444444',
                                                                            fontSize: '14px',
                                                                            marginLeft: '2px'
                                                                        }}
                                                                    ></i>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <h6 className='review-title fw-bold mb-2'>{review.title}</h6>

                                                        <p className='review-content mb-0 text-light'>
                                                            {review.comment}
                                                        </p>
                                                    </div>
                                                ))}

                                                {reviews.length < reviewsTotal && (
                                                    <div className='text-center mt-4'>
                                                        <button
                                                            className='btn btn-outline-light px-4'
                                                            onClick={handleLoadMoreReviews}
                                                            disabled={reviewsLoading}
                                                        >
                                                            {reviewsLoading ? (
                                                                <>
                                                                    <span
                                                                        className='spinner-border spinner-border-sm me-2'
                                                                        role='status'
                                                                        aria-hidden='true'
                                                                    ></span>
                                                                    Loading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Load More Reviews
                                                                    <i className='fas fa-chevron-down ms-2'></i>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className='text-center py-5 bg-black rounded-4'>
                                                <div className='mb-3'>
                                                    <i
                                                        className='fas fa-comment-alt'
                                                        style={{ fontSize: '48px', color: '#444' }}
                                                    ></i>
                                                </div>
                                                <h5>No Reviews Yet</h5>
                                                <p className='text-muted'>Be the first to review this product</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .main-product-image.zoomed {
                    transform: scale(1.05);
                    transition: transform 0.3s ease;
                }

                .thumbnail-item {
                    transition: all 0.2s ease;
                }

                .thumbnail-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }

                .nav-link {
                    transition: all 0.2s ease;
                }

                .nav-link:hover:not(.active) {
                    background: #333333;
                }
            `}</style>
        </section>
    )
}

export default ShopDetailsArea
