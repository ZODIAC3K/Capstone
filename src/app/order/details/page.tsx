'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    FaArrowLeft,
    FaCheck,
    FaTruck,
    FaBox,
    FaSpinner,
    FaTimes,
    FaShoppingBag,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaMapMarkerAlt,
    FaExclamationTriangle
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import Link from 'next/link'
import Header from '@/layout/header/header'

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

export default function OrderDetailsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get('id')

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Currency configuration
    const [currency, setCurrency] = useState({
        symbol: '₹',
        code: 'INR'
    })

    // Helper function to check if a reference is an object
    const isObjectReference = <T extends object>(ref: string | T): ref is T => {
        return typeof ref === 'object' && ref !== null
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
        if (!orderId) {
            setError('Order ID is required')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            console.log(`Fetching order details for: ${orderId}`)
            const response = await fetch(`/api/order?id=${orderId}`)

            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`)

                // Handle specific error codes
                if (response.status === 401) {
                    router.push('/login')
                    throw new Error('Please log in to view your order details')
                } else if (response.status === 403) {
                    throw new Error('You are not authorized to view this order')
                } else if (response.status === 404) {
                    throw new Error('Order not found')
                }

                // Try to get more error details from response
                try {
                    const errorData = await response.json()
                    console.error('API error details:', errorData)
                    throw new Error(errorData.error || `Failed to fetch order: ${response.status}`)
                } catch (jsonError) {
                    throw new Error(`Failed to fetch order: ${response.status}`)
                }
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

    // Get product details (handle both expanded and ID-only references)
    const getProductDetails = (order: Order, index: number) => {
        try {
            if (!order.product_ordered || !Array.isArray(order.product_ordered)) {
                return { title: 'Unknown product', imageUrl: null, price: 0 }
            }

            const productItem = order.product_ordered[index]
            const quantity = order.quantity_ordered[index] || 1
            const size = order.size_ordered[index] || 'N/A'

            // If it's an expanded product object
            if (isObjectReference(productItem)) {
                const product = productItem.product_id
                if (isObjectReference(product)) {
                    return {
                        id: product._id,
                        title: product.title,
                        imageUrl: product.image_id?.image_url || null,
                        price: product.price.amount,
                        quantity,
                        size
                    }
                }
                return { id: product, title: `Product ID: ${product}`, imageUrl: null, price: 0, quantity, size }
            }

            // If it's just a product ID string
            return {
                id: productItem,
                title: `Product ID: ${productItem}`,
                imageUrl: null,
                price: 0,
                quantity,
                size
            }
        } catch (error) {
            console.error('Error getting product details:', error)
            return { title: 'Error loading product', imageUrl: null, price: 0, quantity: 1, size: 'N/A' }
        }
    }

    // Get transaction status (handle both expanded and ID-only references)
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

    // Get Razorpay payment ID if available
    const getRazorpayId = (order: Order) => {
        if (isObjectReference(order.transaction_id) && order.transaction_id.razorpay_payment_id) {
            return order.transaction_id.razorpay_payment_id
        }
        return null
    }

    // Get Address details
    const getAddressDetails = (order: Order) => {
        if (!order.address) {
            return { line1: 'No address information available', line2: '', pincode: '', city: '', state: '' }
        }

        if (isObjectReference(order.address)) {
            const addr = order.address.address
            return {
                line1: addr.firstLine,
                line2: addr.secondLine || '',
                pincode: addr.pincode.toString(),
                city: addr.city,
                state: addr.state
            }
        }

        return {
            line1: 'Address ID:',
            line2: order.address,
            pincode: '',
            city: '',
            state: ''
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    // Get payment status badge class
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

    // Get timeline item class based on order status and current step
    const getTimelineItemClass = (orderStatus: string = '', currentStep: string) => {
        const statusOrder = ['pending', 'processing', 'shipped', 'delivered']

        if (!orderStatus) return ''

        // For cancelled or refunded orders, only the first step is completed
        if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
            return currentStep === 'pending' ? 'completed' : ''
        }

        // Get the indices of the current order status and step in the status order array
        const orderStatusIndex = statusOrder.indexOf(orderStatus)
        const currentStepIndex = statusOrder.indexOf(currentStep)

        // If current step is active (matches the order status)
        if (currentStep === orderStatus) {
            return 'active'
        }

        // If current step is before the current status, it's completed
        if (currentStepIndex < orderStatusIndex) {
            return 'completed'
        }

        // Otherwise, the step is upcoming
        return ''
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <FaSpinner />
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
                return <FaExclamationTriangle />
        }
    }

    // Function to determine if user can cancel an order
    const canCancelOrder = (order: Order) => {
        return order.status === 'pending' || order.status === 'processing'
    }

    // Function to determine if user can request a refund
    const canRequestRefund = (order: Order) => {
        return (
            order.status === 'delivered' &&
            getTransactionStatus(order) === 'successful' &&
            new Date(order.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within 30 days
        )
    }

    // Initialize data fetch
    useEffect(() => {
        fetchOrderDetails()
    }, [orderId])

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

    // Get address details
    const address = getAddressDetails(order)

    return (
        <>
            <Header />
            <div className='bg-dark text-white min-vh-100 p-4 pt-5 mt-5'>
                <div className='container mt-4'>
                    {/* Header */}
                    <div className='d-flex align-items-center mb-4'>
                        <button onClick={() => router.push('/order')} className='btn btn-outline-light me-3'>
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className='h3 m-0'>Order Details</h1>
                            <p className='text-secondary m-0'>
                                Order ID: <span className='text-white'>{order._id}</span>
                            </p>
                        </div>
                        <div className='ms-auto'>
                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Order Info Cards */}
                    <div className='row mb-4'>
                        {/* Order Summary */}
                        <div className='col-md-4 mb-3'>
                            <div className='card bg-dark border-secondary h-100'>
                                <div className='card-header bg-dark border-secondary'>
                                    <h5 className='card-title mb-0 text-white'>Order Summary</h5>
                                </div>
                                <div className='card-body'>
                                    <div className='mb-3'>
                                        <div className='fw-bold text-white-50 mb-1'>Order Date</div>
                                        <div className='text-white'>
                                            {order && order.createdAt && formatDate(order.createdAt)}
                                        </div>
                                    </div>
                                    <div className='mb-3'>
                                        <div className='fw-bold text-white-50 mb-1'>Status</div>
                                        <div>
                                            <span
                                                className={`badge ${getStatusBadgeClass(order?.status || 'pending')}`}
                                            >
                                                {order?.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className='d-flex align-items-center'>
                                        <div className='bg-secondary p-2 rounded me-3'>
                                            <FaMoneyBillWave />
                                        </div>
                                        <div>
                                            <div className='text-white-50 small'>Payment Status</div>
                                            <div>
                                                <span
                                                    className={`badge ${getPaymentStatusBadgeClass(getTransactionStatus(order))}`}
                                                >
                                                    {getTransactionStatus(order).charAt(0).toUpperCase() +
                                                        getTransactionStatus(order).slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className='col-md-4 mb-3'>
                            <div className='card bg-dark border-secondary h-100'>
                                <div className='card-header bg-dark border-secondary'>
                                    <h5 className='card-title mb-0 text-white'>Shipping Address</h5>
                                </div>
                                <div className='card-body text-white'>
                                    <div className='d-flex align-items-start mb-3'>
                                        <div className='bg-secondary p-2 rounded me-3 mt-1'>
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div>
                                            <div>{address.line1}</div>
                                            {address.line2 && <div>{address.line2}</div>}
                                            {address.city && (
                                                <div>
                                                    {address.city}, {address.state} {address.pincode}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className='col-md-4 mb-3'>
                            <div className='card bg-dark border-secondary h-100'>
                                <div className='card-header bg-dark border-secondary'>
                                    <h5 className='card-title mb-0 text-white'>Payment Details</h5>
                                </div>
                                <div className='card-body'>
                                    <div className='col-md-6 mb-3'>
                                        <div className='text-end'>
                                            <div className='d-flex justify-content-between mb-2'>
                                                <span className='text-white-50'>Subtotal:</span>
                                                <span className='text-white fw-bold'>
                                                    {currency.symbol}
                                                    {order?.total_amount?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            {order?.total_amount !== order?.amount_paid && (
                                                <div className='d-flex justify-content-between mb-2'>
                                                    <span className='text-white-50'>Discount:</span>
                                                    <span className='text-success'>
                                                        -{currency.symbol}
                                                        {(order?.total_amount - order?.amount_paid).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className='d-flex justify-content-between'>
                                                <span className='fw-bold text-white-50'>Total:</span>
                                                <span className='fw-bold text-white'>
                                                    {currency.symbol}
                                                    {order?.amount_paid?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {getRazorpayId(order) && (
                                        <div className='mt-3 pt-2 border-top border-secondary'>
                                            <div className='text-white-50 small'>Transaction ID</div>
                                            <div className='text-truncate'>{getRazorpayId(order)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className='card bg-dark border-secondary mb-4'>
                        <div className='card-header bg-dark border-secondary'>
                            <h5 className='card-title mb-0 text-white'>Order Items</h5>
                        </div>
                        <div className='card-body p-0'>
                            <div className='table-responsive'>
                                <table className='table table-dark mb-0'>
                                    <thead className='border-bottom border-secondary'>
                                        <tr>
                                            <th className='text-white-50'>Product</th>
                                            <th className='text-white-50'>Size</th>
                                            <th className='text-white-50'>Quantity</th>
                                            <th className='text-white-50'>Price</th>
                                            <th className='text-white-50 text-end'>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order?.product_ordered?.map((_, index) => {
                                            const item = getProductDetails(order, index)
                                            return (
                                                <tr key={index} className='border-bottom border-secondary'>
                                                    <td className='text-white'>{item.title}</td>
                                                    <td className='text-white'>{item.size}</td>
                                                    <td className='text-white'>{item.quantity}</td>
                                                    <td className='text-white'>
                                                        {currency.symbol}
                                                        {item.price.toFixed(2)}
                                                    </td>
                                                    <td className='text-white text-end'>
                                                        {currency.symbol}
                                                        {(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className='card bg-dark border-secondary mb-4'>
                        <div className='card-header bg-dark border-secondary'>
                            <h5 className='card-title mb-0 text-white'>Order Timeline</h5>
                        </div>
                        <div className='card-body'>
                            <div className='order-timeline'>
                                <div
                                    className={`timeline-item ${order?.status === 'pending' ? 'active' : 'completed'}`}
                                >
                                    <div className='timeline-marker'></div>
                                    <div className='timeline-content'>
                                        <h5 className='text-white'>Order Placed</h5>
                                        <p className='text-white-50'>
                                            {order && order.createdAt && formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className={`timeline-item ${getTimelineItemClass(order?.status, 'processing')}`}>
                                    <div className='timeline-marker'></div>
                                    <div className='timeline-content'>
                                        <h5 className='text-white'>Processing</h5>
                                        <p className='text-white-50'>Order is being prepared</p>
                                    </div>
                                </div>
                                <div className={`timeline-item ${getTimelineItemClass(order?.status, 'shipped')}`}>
                                    <div className='timeline-marker'></div>
                                    <div className='timeline-content'>
                                        <h5 className='text-white'>Shipped</h5>
                                        <p className='text-white-50'>Order has been shipped</p>
                                    </div>
                                </div>
                                <div className={`timeline-item ${getTimelineItemClass(order?.status, 'delivered')}`}>
                                    <div className='timeline-marker'></div>
                                    <div className='timeline-content'>
                                        <h5 className='text-white'>Delivered</h5>
                                        <p className='text-white-50'>Order has been delivered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className='d-flex justify-content-between'>
                        <Link href='/order' className='btn btn-outline-light'>
                            Back to Orders
                        </Link>

                        <div>
                            {canCancelOrder(order) && (
                                <Link href={`/order?action=cancel&id=${order._id}`} className='btn btn-danger me-2'>
                                    Cancel Order
                                </Link>
                            )}

                            {canRequestRefund(order) && (
                                <Link href={`/order?action=refund&id=${order._id}`} className='btn btn-warning me-2'>
                                    Request Refund
                                </Link>
                            )}

                            {order.status === 'delivered' && (
                                <Link href={`/review?orderId=${order._id}`} className='btn btn-success'>
                                    Write a Review
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* CSS for timeline */}
                <style jsx>{`
                    .order-timeline {
                        position: relative;
                        padding-left: 30px;
                    }

                    .order-timeline::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 15px;
                        width: 2px;
                        background-color: #444;
                    }

                    .timeline-item {
                        position: relative;
                        margin-bottom: 20px;
                    }

                    .timeline-marker {
                        position: absolute;
                        left: -30px;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background-color: #444;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1;
                    }

                    .timeline-content {
                        padding-left: 10px;
                    }

                    .timeline-item.completed .timeline-marker {
                        background-color: #22c55e;
                    }

                    .timeline-item.active .timeline-marker {
                        background-color: #0d6efd;
                        box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25);
                    }
                `}</style>
            </div>
        </>
    )
}
