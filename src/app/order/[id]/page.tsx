'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FaArrowLeft, FaCheck, FaTruck, FaBox, FaSpinner, FaTimes, FaShoppingBag } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Link from 'next/link'

// Reuse types from the orders page
interface OrderItem {
    product_id: {
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

interface Address {
    _id: string
    address: {
        firstLine: string
        secondLine?: string
        pincode: number
        city: string
        state: string
    }
}

interface Transaction {
    _id: string
    amount: number
    currency: string
    status: 'pending' | 'successful' | 'failed'
    razorpay_payment_id?: string
    razorpay_order_id?: string
    createdAt: string
}

interface Order {
    _id: string
    user_id:
        | string
        | {
              _id: string
              email: string
              fname: string
              lname: string
          }
    product_ordered: string[] | OrderItem[]
    size_ordered: string[]
    quantity_ordered: number[]
    coupon_used: string[] | null
    offer_used: string[] | null
    total_amount: number
    amount_paid: number
    address: string | Address
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
    transaction_id: string | Transaction
    createdAt: string
    updatedAt: string
}

// Product type for fetching additional details
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

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<Order | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Currency configuration
    const [currency, setCurrency] = useState({
        symbol: '₹',
        code: 'INR'
    })

    const orderId = params.id as string

    // Helper function to check if a reference is an object
    const isObjectReference = <T extends object>(ref: string | T): ref is T => {
        return typeof ref === 'object' && ref !== null
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/order?id=${orderId}`)

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login')
                    throw new Error('Please log in to view order details')
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

                setOrder(orderData)

                // Fetch product details if they're not expanded
                if (orderData.product_ordered && Array.isArray(orderData.product_ordered)) {
                    if (typeof orderData.product_ordered[0] === 'string') {
                        // Products are just IDs, fetch details
                        await fetchProductDetails(orderData.product_ordered as string[], orderData.quantity_ordered)
                    } else {
                        // Products are already expanded, extract the relevant details
                        const productItems = orderData.product_ordered as OrderItem[]
                        setProducts(
                            productItems.map((item) => ({
                                _id: item.product_id._id,
                                title: item.product_id.title,
                                price: item.product_id.price,
                                image_id: item.product_id.image_id,
                                quantity: item.quantity
                            }))
                        )
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
    const fetchProductDetails = async (productIds: string[], quantities: number[]) => {
        try {
            const productPromises = productIds.map((id, index) =>
                fetch(`/api/product?id=${id}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success && data.data) {
                            return {
                                ...data.data,
                                quantity: quantities[index] || 1
                            }
                        }
                        return null
                    })
                    .catch((err) => {
                        console.error(`Error fetching product ${id}:`, err)
                        return null
                    })
            )

            const productResults = await Promise.all(productPromises)
            setProducts(productResults.filter((p) => p !== null))
        } catch (err) {
            console.error('Error fetching product details:', err)
        }
    }

    // Get transaction status
    const getTransactionStatus = (order: Order) => {
        if (isObjectReference(order.transaction_id)) {
            return order.transaction_id.status
        }

        // Default status based on order status if transaction is not expanded
        switch (order.status) {
            case 'cancelled':
            case 'refunded':
                return 'failed'
            case 'delivered':
                return 'successful'
            default:
                return 'pending'
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Format address
    const formatAddress = (address: Address) => {
        const addr = address.address
        return (
            <div>
                <div className='fw-bold mb-1'>Shipping Address</div>
                <div>{addr.firstLine}</div>
                {addr.secondLine && <div>{addr.secondLine}</div>}
                <div>
                    {addr.city}, {addr.state}
                </div>
                <div>PIN: {addr.pincode}</div>
            </div>
        )
    }

    // Get order status badge class
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-warning text-dark'
            case 'processing':
                return 'bg-primary text-white'
            case 'shipped':
                return 'bg-info text-white'
            case 'delivered':
                return 'bg-success text-white'
            case 'cancelled':
                return 'bg-danger text-white'
            case 'refunded':
                return 'bg-secondary text-white'
            default:
                return 'bg-secondary'
        }
    }

    // Get transaction status badge class
    const getPaymentStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'successful':
                return 'bg-success text-white'
            case 'pending':
                return 'bg-warning text-dark'
            case 'failed':
                return 'bg-danger text-white'
            default:
                return 'bg-secondary'
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <FaSpinner className='fa-spin' />
            case 'processing':
                return <FaBox />
            case 'shipped':
                return <FaTruck />
            case 'delivered':
                return <FaCheck />
            case 'cancelled':
            case 'refunded':
                return <FaTimes />
            default:
                return <FaSpinner />
        }
    }

    // Initialize data fetch
    useEffect(() => {
        fetchOrderDetails()
    }, [orderId])

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

    // No order found
    if (!order) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <div className='mb-4'>
                        <FaShoppingBag size={60} className='text-muted' />
                    </div>
                    <h2>Order Not Found</h2>
                    <p className='text-muted mb-4'>
                        The order you're looking for doesn't exist or you don't have access to it.
                    </p>
                    <Link href='/order' className='btn btn-primary'>
                        View All Orders
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
                    <button onClick={() => router.push('/order')} className='btn btn-outline-light me-3'>
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className='h3 m-0'>Order Details</h1>
                        <p className='text-white-50 m-0'>Order #{order._id.substring(order._id.length - 8)}</p>
                    </div>
                    <div className='ms-auto'>
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                </div>

                {/* Order summary card */}
                <div className='card bg-dark border-secondary mb-4'>
                    <div className='card-header bg-dark border-secondary'>
                        <div className='d-flex justify-content-between align-items-center'>
                            <h5 className='card-title mb-0'>Order Summary</h5>
                            <span className='text-white-50'>{formatDate(order.createdAt)}</span>
                        </div>
                    </div>
                    <div className='card-body'>
                        <div className='row'>
                            <div className='col-md-6 mb-3'>
                                <div className='mb-3'>
                                    <div className='fw-bold mb-1'>Order Status</div>
                                    <div className='d-flex align-items-center'>
                                        <span className='me-2'>{getStatusIcon(order.status)}</span>
                                        <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                                    </div>
                                </div>

                                <div className='mb-3'>
                                    <div className='fw-bold mb-1'>Payment Status</div>
                                    <span
                                        className={`badge ${getPaymentStatusBadgeClass(getTransactionStatus(order))}`}
                                    >
                                        {getTransactionStatus(order).charAt(0).toUpperCase() +
                                            getTransactionStatus(order).slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className='col-md-6 mb-3'>
                                {isObjectReference(order.address) ? (
                                    formatAddress(order.address)
                                ) : (
                                    <div>
                                        <div className='fw-bold mb-1'>Shipping Address</div>
                                        <div className='text-white-50'>Address ID: {order.address}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products list */}
                <div className='card bg-dark border-secondary mb-4'>
                    <div className='card-header bg-dark border-secondary'>
                        <h5 className='card-title mb-0'>Order Items</h5>
                    </div>
                    <div className='card-body p-0'>
                        <div className='table-responsive'>
                            <table className='table table-dark table-hover mb-0'>
                                <thead>
                                    <tr className='border-bottom border-secondary'>
                                        <th>Product</th>
                                        <th className='text-center'>Quantity</th>
                                        <th className='text-center'>Price</th>
                                        <th className='text-end'>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length > 0 ? (
                                        products.map((product, index) => (
                                            <tr key={product._id} className='border-bottom border-secondary'>
                                                <td>
                                                    <div className='d-flex align-items-center'>
                                                        {product.image_id?.image_url ? (
                                                            <div
                                                                className='me-3'
                                                                style={{ width: '60px', height: '60px' }}
                                                            >
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
                                                            <small className='text-white-50'>
                                                                Size: {order.size_ordered?.[index] || 'N/A'}
                                                            </small>
                                                            {product.creator_id && (
                                                                <div className='text-white-50'>
                                                                    By: {product.creator_id.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='text-center align-middle'>
                                                    {product.quantity || order.quantity_ordered?.[index] || 1}
                                                </td>
                                                <td className='text-center align-middle'>
                                                    {currency.symbol}
                                                    {product.price.amount.toFixed(2)}
                                                </td>
                                                <td className='text-end align-middle'>
                                                    {currency.symbol}
                                                    {(
                                                        product.price.amount *
                                                        (product.quantity || order.quantity_ordered?.[index] || 1)
                                                    ).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className='text-center py-4'>
                                                <div className='text-muted'>No product details available</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Order totals */}
                <div className='card bg-dark border-secondary mb-4'>
                    <div className='card-header bg-dark border-secondary'>
                        <h5 className='card-title mb-0'>Payment Details</h5>
                    </div>
                    <div className='card-body'>
                        <div className='row'>
                            <div className='col-md-6 mb-3'>
                                <div className='mb-3'>
                                    <div className='fw-bold mb-1'>Payment Method</div>
                                    <div>Online Payment</div>
                                </div>

                                {isObjectReference(order.transaction_id) &&
                                    order.transaction_id.razorpay_payment_id && (
                                        <div className='mb-3'>
                                            <div className='fw-bold mb-1'>Transaction ID</div>
                                            <div className='text-truncate'>
                                                {order.transaction_id.razorpay_payment_id}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            <div className='col-md-6'>
                                <div className='table-responsive'>
                                    <table className='table table-dark mb-0'>
                                        <tbody>
                                            <tr>
                                                <td>Subtotal</td>
                                                <td className='text-end'>
                                                    {currency.symbol}
                                                    {order.total_amount.toFixed(2)}
                                                </td>
                                            </tr>
                                            {order.total_amount > order.amount_paid && (
                                                <tr>
                                                    <td>Discount</td>
                                                    <td className='text-end text-success'>
                                                        -{currency.symbol}
                                                        {(order.total_amount - order.amount_paid).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className='border-top border-secondary'>
                                                <td className='fw-bold'>Total</td>
                                                <td className='text-end fw-bold'>
                                                    {currency.symbol}
                                                    {order.amount_paid.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className='d-flex justify-content-between'>
                    <Link href='/order' className='btn btn-outline-light'>
                        Back to Orders
                    </Link>

                    <div>
                        {order.status === 'delivered' && (
                            <Link href={`/review/create?orderId=${order._id}`} className='btn btn-success me-2'>
                                Write a Review
                            </Link>
                        )}

                        <a href={`mailto:support@example.com?subject=Order%20${order._id}`} className='btn btn-primary'>
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
