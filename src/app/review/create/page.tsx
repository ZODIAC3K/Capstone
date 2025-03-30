'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaSpinner,
    FaTimes,
    FaCheck,
    FaArrowLeft,
    FaShoppingBag
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import Link from 'next/link'

interface Product {
    _id: string
    title: string
    price: {
        amount: number
        currency: string
    }
    description?: string
    image_id?: {
        image_url: string
    }
    creator_id?: {
        name: string
    }
}

interface OrderItem {
    product_id:
        | string
        | {
              _id: string
              title: string
              price: {
                  amount: number
                  currency: string
              }
              image_id?: {
                  image_url: string
              }
          }
    quantity: number
    size: string
}

interface Order {
    _id: string
    product_ordered: string[] | OrderItem[]
    quantity_ordered: number[]
    size_ordered: string[]
    status: string
    createdAt: string
}

export default function CreateReviewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')

    const [order, setOrder] = useState<Order | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
    const [rating, setRating] = useState<number>(5)
    const [title, setTitle] = useState('')
    const [comment, setComment] = useState('')
    const [hoverRating, setHoverRating] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Helper function to check if a reference is an object
    const isObjectReference = <T extends object>(ref: string | T): ref is T => {
        return typeof ref === 'object' && ref !== null
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
        if (!orderId) return

        try {
            setLoading(true)
            const response = await fetch(`/api/order?id=${orderId}`)

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login')
                    throw new Error('Please log in to write a review')
                }
                throw new Error(`Failed to fetch order: ${response.status}`)
            }

            const data = await response.json()
            console.log('Order details response:', data)

            if (data.success && data.data) {
                // Check if the order is directly in data or nested in data.order
                let orderData: Order
                if (data.data.order) {
                    orderData = data.data.order
                } else if (data.data._id) {
                    orderData = data.data
                } else {
                    throw new Error('Invalid order data format')
                }

                // Only allow reviews for delivered orders
                if (orderData.status !== 'delivered') {
                    throw new Error('You can only review products from delivered orders')
                }

                setOrder(orderData)

                // Fetch product details if they're not expanded
                if (orderData.product_ordered && Array.isArray(orderData.product_ordered)) {
                    if (typeof orderData.product_ordered[0] === 'string') {
                        // Products are just IDs, fetch details
                        await fetchProductDetails(orderData.product_ordered as string[])
                    } else {
                        // Products are already expanded, extract the relevant details
                        const productItems = orderData.product_ordered as OrderItem[]
                        const productInfo = productItems
                            .map((item) => {
                                if (isObjectReference(item.product_id)) {
                                    return {
                                        _id: item.product_id._id,
                                        title: item.product_id.title,
                                        price: item.product_id.price,
                                        image_id: item.product_id.image_id
                                    }
                                }
                                return null
                            })
                            .filter((p) => p !== null) as Product[]

                        setProducts(productInfo)

                        if (productInfo.length > 0) {
                            setSelectedProduct(productInfo[0]._id)
                        }
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to fetch order details')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load order details')
            console.error('Error fetching order:', err)
        } finally {
            setLoading(false)
        }
    }

    // Fetch product details if they're not expanded
    const fetchProductDetails = async (productIds: string[]) => {
        try {
            const productPromises = productIds.map((id) =>
                fetch(`/api/product?id=${id}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success && data.data) {
                            return data.data
                        }
                        return null
                    })
                    .catch((err) => {
                        console.error(`Error fetching product ${id}:`, err)
                        return null
                    })
            )

            const productResults = await Promise.all(productPromises)
            const validProducts = productResults.filter((p) => p !== null) as Product[]
            setProducts(validProducts)

            if (validProducts.length > 0) {
                setSelectedProduct(validProducts[0]._id)
            }
        } catch (err) {
            console.error('Error fetching product details:', err)
        }
    }

    // Check if user has already reviewed the selected product
    const checkExistingReview = async (productId: string) => {
        try {
            const response = await fetch(`/api/review/check?productId=${productId}`)
            const data = await response.json()

            if (data.success && data.exists) {
                toast.warning("You've already reviewed this product")
                return true
            }

            return false
        } catch (err) {
            console.error('Error checking existing review:', err)
            return false
        }
    }

    // Handle product selection
    const handleProductSelect = async (productId: string) => {
        const hasReviewed = await checkExistingReview(productId)
        if (!hasReviewed) {
            setSelectedProduct(productId)
        }
    }

    // Handle review submission
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedProduct) {
            toast.error('Please select a product to review')
            return
        }

        if (rating < 1 || rating > 5) {
            toast.error('Please select a rating between 1 and 5')
            return
        }

        if (!title.trim()) {
            toast.error('Please provide a review title')
            return
        }

        if (!comment.trim()) {
            toast.error('Please provide a review comment')
            return
        }

        try {
            setSubmitting(true)

            const reviewData = {
                product_id: selectedProduct,
                rating,
                title,
                comment,
                order_id: orderId
            }

            console.log('Submitting review:', reviewData)

            const response = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            })

            const data = await response.json()
            console.log('Review submission response:', data)

            if (response.ok && data.success) {
                toast.success('Your review has been submitted successfully!')

                // Redirect to product page or order details
                setTimeout(() => {
                    router.push(`/product/${selectedProduct}`)
                }, 1500)
            } else {
                throw new Error(data.error || 'Failed to submit review')
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit review')
            console.error('Error submitting review:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Initialize data fetch
    useEffect(() => {
        if (orderId) {
            fetchOrderDetails()
        } else {
            setError('Missing order ID')
            setLoading(false)
        }
    }, [orderId])

    // Render star rating
    const renderStarRating = (value: number, onRate: (rate: number) => void) => {
        return (
            <div className='d-flex gap-1'>
                {[1, 2, 3, 4, 5].map((star) => {
                    const activeValue = hoverRating || rating

                    return (
                        <span
                            key={star}
                            onClick={() => onRate(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                        >
                            {activeValue >= star ? (
                                <FaStar className='text-warning' />
                            ) : activeValue >= star - 0.5 ? (
                                <FaStarHalfAlt className='text-warning' />
                            ) : (
                                <FaRegStar className='text-warning' />
                            )}
                        </span>
                    )
                })}
            </div>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <FaSpinner className='fa-spin mb-3' size={40} />
                    <h3>Loading order details...</h3>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <div className='text-danger mb-3'>
                        <FaTimes size={40} />
                    </div>
                    <h3>{error}</h3>
                    <button className='btn btn-primary mt-3' onClick={() => router.push('/order')}>
                        Back to Orders
                    </button>
                </div>
            </div>
        )
    }

    // No products to review
    if (products.length === 0) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <div className='mb-4'>
                        <FaShoppingBag size={60} className='text-muted' />
                    </div>
                    <h2>No Products to Review</h2>
                    <p className='text-muted mb-4'>We couldn't find any products to review for this order.</p>
                    <Link href={`/order/${orderId}`} className='btn btn-primary'>
                        Back to Order Details
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className='bg-dark text-white min-vh-100 p-4'>
            <div className='container'>
                {/* Header */}
                <div className='d-flex align-items-center mb-4'>
                    <button onClick={() => router.push(`/order/${orderId}`)} className='btn btn-outline-light me-3'>
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className='h3 m-0'>Write a Review</h1>
                        <p className='text-white-50 m-0'>Order #{orderId?.substring((orderId?.length || 0) - 8)}</p>
                    </div>
                </div>

                {/* Product selection */}
                {products.length > 1 && (
                    <div className='card bg-dark border-secondary mb-4'>
                        <div className='card-header bg-dark border-secondary'>
                            <h5 className='card-title mb-0'>Select a Product to Review</h5>
                        </div>
                        <div className='card-body'>
                            <div className='row'>
                                {products.map((product) => (
                                    <div key={product._id} className='col-md-4 mb-3'>
                                        <div
                                            className={`card bg-dark border-secondary h-100 ${selectedProduct === product._id ? 'border-primary' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleProductSelect(product._id)}
                                        >
                                            <div className='card-body p-3'>
                                                <div className='d-flex align-items-center'>
                                                    {product.image_id?.image_url ? (
                                                        <div className='me-3' style={{ width: '60px', height: '60px' }}>
                                                            <img
                                                                src={product.image_id.image_url}
                                                                alt={product.title}
                                                                className='img-fluid rounded'
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className='me-3 d-flex align-items-center justify-content-center bg-secondary rounded'
                                                            style={{ width: '60px', height: '60px' }}
                                                        >
                                                            <FaShoppingBag className='text-dark' />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className='fw-medium'>{product.title}</div>
                                                        <div className='text-white-50'>
                                                            ₹{product.price.amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedProduct === product._id && (
                                                <div className='card-footer bg-primary text-white text-center py-1'>
                                                    <small>Selected</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected product preview */}
                {selectedProduct && (
                    <div className='card bg-dark border-secondary mb-4'>
                        <div className='card-header bg-dark border-secondary'>
                            <h5 className='card-title mb-0'>
                                {products.length > 1 ? 'Selected Product' : 'Product to Review'}
                            </h5>
                        </div>
                        <div className='card-body'>
                            {products.map((product) => {
                                if (product._id !== selectedProduct) return null

                                return (
                                    <div key={product._id} className='d-flex align-items-center'>
                                        {product.image_id?.image_url ? (
                                            <div className='me-4' style={{ width: '100px', height: '100px' }}>
                                                <img
                                                    src={product.image_id.image_url}
                                                    alt={product.title}
                                                    className='img-fluid rounded'
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className='me-4 d-flex align-items-center justify-content-center bg-secondary rounded'
                                                style={{ width: '100px', height: '100px' }}
                                            >
                                                <FaShoppingBag size={30} className='text-dark' />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className='h5 mb-1'>{product.title}</h4>
                                            <div className='text-white-50 mb-1'>₹{product.price.amount.toFixed(2)}</div>
                                            {product.creator_id && (
                                                <div className='text-white-50'>By: {product.creator_id.name}</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Review form */}
                <form onSubmit={handleSubmitReview}>
                    <div className='card bg-dark border-secondary mb-4'>
                        <div className='card-header bg-dark border-secondary'>
                            <h5 className='card-title mb-0'>Your Review</h5>
                        </div>
                        <div className='card-body'>
                            <div className='mb-4'>
                                <label className='form-label'>Rating</label>
                                <div className='mb-2'>
                                    {renderStarRating(rating, (newRating) => setRating(newRating))}
                                </div>
                                <div className='text-white-50'>
                                    {rating === 5 && 'Excellent! I love it'}
                                    {rating === 4 && 'Good product, recommended'}
                                    {rating === 3 && 'Average, meets expectations'}
                                    {rating === 2 && 'Below average, needs improvement'}
                                    {rating === 1 && 'Poor, would not recommend'}
                                </div>
                            </div>

                            <div className='mb-4'>
                                <label htmlFor='reviewTitle' className='form-label'>
                                    Review Title
                                </label>
                                <input
                                    type='text'
                                    id='reviewTitle'
                                    className='form-control bg-dark text-white border-secondary'
                                    placeholder='Summarize your experience in a short title'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className='mb-3'>
                                <label htmlFor='reviewComment' className='form-label'>
                                    Your Review
                                </label>
                                <textarea
                                    id='reviewComment'
                                    className='form-control bg-dark text-white border-secondary'
                                    placeholder='Share your experience with this product'
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={5}
                                    maxLength={1000}
                                    required
                                ></textarea>
                                <div className='form-text text-white-50 mt-2'>{comment.length}/1000 characters</div>
                            </div>
                        </div>
                        <div className='card-footer bg-dark border-secondary d-flex justify-content-between'>
                            <Link href={`/order/${orderId}`} className='btn btn-outline-light'>
                                Cancel
                            </Link>
                            <button type='submit' className='btn btn-success' disabled={submitting || !selectedProduct}>
                                {submitting ? (
                                    <>
                                        <FaSpinner className='fa-spin me-2' />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FaCheck className='me-2' />
                                        Submit Review
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
