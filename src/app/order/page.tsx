'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaSyncAlt, FaTimes, FaShoppingBag, FaRupeeSign, FaSpinner, FaBox } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    transcation_id: string | Transaction
    createdAt: string
    updatedAt: string
}

export default function OrderPage() {
	// Currency configuration
	const [currency, setCurrency] = useState({
        symbol: '₹',
        code: 'INR'
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('All Statuses')
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All Payment Statuses')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showRefundRequestModal, setShowRefundRequestModal] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false)
    const [refundLoading, setRefundLoading] = useState(false)
    const [refundReason, setRefundReason] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const ordersPerPage = 5
    const router = useRouter()

    // Add missing pagination state and function
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
    })

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/order')

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login')
                    throw new Error('Please log in to view your orders')
                }
                throw new Error(`Failed to fetch orders: ${response.status}`)
            }

            const data = await response.json()
            console.log('Orders API response:', data)

            if (data.success) {
                // Handle different API response structures
                if (data.data.orders) {
                    const formattedOrders = data.data.orders.map((order: any) => {
                        // Create a properly formatted order object from whatever is returned by the API
                        const formattedOrder: Order = {
                            _id: order._id,
                            user_id: order.user_id,
                            product_ordered: Array.isArray(order.product_ordered)
                                ? order.product_ordered.map((product: any) => {
                                      // Convert expanded product objects to OrderItem format if needed
                                      if (typeof product === 'object' && product !== null) {
                                          return {
                                              product_id: {
                                                  _id: product._id,
                                                  title: product.title,
                                                  price: product.price,
                                                  image_id: product.image_id
                                              },
                                              quantity: 1, // Will be overridden by quantity_ordered
                                              size: '' // Will be overridden by size_ordered
                                          }
                                      }
                                      // Keep as is if just an ID string
                                      return product
                                  })
                                : order.product_ordered,
                            size_ordered: order.size_ordered,
                            quantity_ordered: order.quantity_ordered,
                            coupon_used: order.coupon_used,
                            offer_used: order.offer_used,
                            total_amount: order.total_amount,
                            amount_paid: order.amount_paid,
                            address: order.address,
                            status: order.status,
                            transcation_id: order.transcation_id,
                            createdAt: order.createdAt,
                            updatedAt: order.updatedAt
                        }
                        return formattedOrder
                    })

                    setOrders(formattedOrders)
                    setPagination(data.data.pagination)
                } else {
                    console.warn('Unexpected API response format:', data)
                    setOrders([])
                }
            } else {
                throw new Error(data.error || 'Failed to fetch orders')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load orders')
            console.error('Error fetching orders:', err)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch order details
    const fetchOrderDetails = async (orderId: string) => {
        try {
            const response = await fetch(`/api/order?id=${orderId}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch order details: ${response.status}`)
            }

            const data = await response.json()
            console.log('Order details response:', data)

            if (data.success && data.data) {
                // Check if the order is directly in data or nested in data.order
                if (data.data.order) {
                    return data.data.order
                } else if (data.data._id) {
                    // If the order is directly in the data property
                    return data.data
                } else {
                    console.warn('Unexpected API response format:', data)
                    return null
                }
            } else {
                throw new Error(data.error || 'Failed to fetch order details')
            }
        } catch (err) {
            console.error('Error fetching order details:', err)
            toast.error('Failed to load order details')
            return null
        }
    }

    // Initial data fetch
    useEffect(() => {
        fetchOrders()
    }, [])

	// Filter orders based on search query and selected filters
	useEffect(() => {
        if (!orders.length) {
            setFilteredOrders([])
            return
        }

        let result = [...orders]

		// Filter by search query
		if (searchQuery) {
            const query = searchQuery.toLowerCase()
			result = result.filter(
				(order) =>
                    order._id.toLowerCase().includes(query) ||
                    order.user_id.email.toLowerCase().includes(query) ||
                    order.status.toLowerCase().includes(query)
            )
        }

        // Filter by order status
        if (selectedStatus !== 'All Statuses') {
            result = result.filter((order) => order.status.toLowerCase() === selectedStatus.toLowerCase())
		}

		// Filter by payment status
        if (selectedPaymentStatus !== 'All Payment Statuses') {
            result = result.filter((order) => {
                if (selectedPaymentStatus === 'Paid') {
                    return order.transcation_id.status === 'successful'
                } else if (selectedPaymentStatus === 'Refunded') {
                    return order.status === 'refunded'
                } else if (selectedPaymentStatus === 'Pending') {
                    return order.transcation_id.status === 'pending'
                } else if (selectedPaymentStatus === 'Failed') {
                    return order.transcation_id.status === 'failed'
                }
                return true
            })
        }

        setFilteredOrders(result)
        setCurrentPage(1) // Reset to first page when filters change
    }, [searchQuery, selectedStatus, selectedPaymentStatus, orders])

	// Calculate pagination
    const indexOfLastOrder = currentPage * ordersPerPage
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

    // Function to handle order cancellation
    const handleOrderCancel = async () => {
		if (selectedOrder) {
            try {
                // Show loading state
                setCancelLoading(true)
                toast.info('Processing your cancellation request...')

                // Call API to cancel order
                const response = await fetch(`/api/order/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: selectedOrder._id,
                        reason: 'User requested cancellation'
                    })
                })

                const data = await response.json()

                if (response.ok && data.success) {
                    toast.success('Order cancelled successfully')

                    // Update the transaction status
                    const transactionId = getTransactionId(selectedOrder)
                    if (transactionId) {
                        try {
                            await fetch('/api/transaction', {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    id: transactionId,
                                    status: 'failed'
                                })
                            })
                        } catch (err) {
                            console.error('Error updating transaction status:', err)
                            // Continue even if transaction update fails
                        }
                    }

                    // Refresh orders
                    fetchOrders()
                } else {
                    toast.error(data.error || 'Failed to cancel order')
                }
            } catch (error) {
                console.error('Error cancelling order:', error)
                toast.error('An error occurred while cancelling the order')
            } finally {
                setShowCancelModal(false)
                setCancelLoading(false)
            }
        }
    }

    // Function to handle refund request
    const handleRefundRequest = async () => {
        if (selectedOrder && refundReason.trim()) {
            try {
                // Show loading state
                setRefundLoading(true)
                toast.info('Processing your refund request...')

                // Send refund request to API
                const response = await fetch(`/api/order/refund`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: selectedOrder._id,
                        reason: refundReason.trim()
                    })
                })

                const data = await response.json()

                if (response.ok && data.success) {
                    toast.success('Refund request submitted successfully!')

                    // Update the order status locally
                    setOrders((prev) =>
                        prev.map((order) =>
                            order._id === selectedOrder._id ? { ...order, status: 'refunded' } : order
                        )
                    )
                } else {
                    toast.error(data.error || 'Failed to submit refund request')
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Error processing refund request')
                console.error('Refund request error:', err)
            } finally {
                setRefundReason('')
                setShowRefundRequestModal(false)
                setRefundLoading(false)
            }
        } else {
            toast.warning('Please provide a reason for your refund request')
        }
    }

    // Additional functions to check the type of references
    const isObjectReference = <T extends object>(ref: string | T): ref is T => {
        return typeof ref === 'object' && ref !== null
    }

    // Get order product summary (handle both expanded and ID-only references)
    const getOrderSummary = (order: Order) => {
        try {
            if (!order.product_ordered || !Array.isArray(order.product_ordered)) {
                return { title: 'No product information', imageUrl: null, count: 0 }
            }

            // Check if product_ordered contains expanded product objects or just IDs
            if (order.product_ordered.length > 0) {
                if (isObjectReference(order.product_ordered[0])) {
                    // Expanded products available as OrderItem objects
                    const items = order.product_ordered as OrderItem[]

                    if (items.length === 0) return { title: 'No products', imageUrl: null, count: 0 }

                    const firstProduct = items[0].product_id
                    const imageUrl =
                        isObjectReference(firstProduct) && firstProduct.image_id?.image_url
                            ? firstProduct.image_id.image_url
                            : null

                    if (items.length === 1) {
                        const title = isObjectReference(firstProduct) ? firstProduct.title : 'Unknown product'
                        return {
                            title,
                            imageUrl,
                            count: 1
                        }
                    } else {
                        const title = isObjectReference(firstProduct) ? firstProduct.title : 'Unknown product'
                        return {
                            title: `${title} +${items.length - 1} more`,
                            imageUrl,
                            count: items.length
                        }
                    }
                } else {
                    // Just product IDs (strings)
                    const productCount = order.product_ordered.length
                    if (productCount === 0) return { title: 'No products', imageUrl: null, count: 0 }

                    if (productCount === 1) {
                        return {
                            title: `Product ID: ${order.product_ordered[0]}`,
                            imageUrl: null,
                            count: 1
                        }
		} else {
                        return {
                            title: `${productCount} Products`,
                            imageUrl: null,
                            count: productCount
                        }
                    }
                }
            }

            return { title: 'No products', imageUrl: null, count: 0 }
        } catch (error) {
            console.error('Error in getOrderSummary', error)
            return { title: 'Error loading products', imageUrl: null, count: 0 }
        }
    }

	// Function to determine if user can cancel an order
	const canCancelOrder = (order: Order) => {
        return order.status === 'pending' || order.status === 'processing'
    }

	// Function to determine if user can request a refund
	const canRequestRefund = (order: Order) => {
        // For expanded transaction
        if (isObjectReference(order.transcation_id)) {
            return (
                order.status === 'delivered' &&
                order.transcation_id.status === 'successful' &&
                new Date(order.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within 30 days
            )
        }

        // If transaction is just an ID, assume it's successful if order is delivered
		return (
            order.status === 'delivered' && new Date(order.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
    }

    // Get transaction status (handle both expanded and ID-only references)
    const getTransactionStatus = (order: Order) => {
        if (isObjectReference(order.transcation_id)) {
            return order.transcation_id.status
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

    // Get transaction ID (handle both expanded and ID-only references)
    const getTransactionId = (order: Order) => {
        if (isObjectReference(order.transcation_id)) {
            return order.transcation_id._id
        }
        return order.transcation_id
    }

    // Get Razorpay payment ID if available
    const getRazorpayId = (order: Order) => {
        if (isObjectReference(order.transcation_id) && order.transcation_id.razorpay_payment_id) {
            return order.transcation_id.razorpay_payment_id
        }
        return null
    }

	// CSS classes for status badges
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

	// CSS classes for payment status badges
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

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <FaSpinner className='fa-spin mb-3' size={40} />
                    <h3>Loading your orders...</h3>
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
                    <button
                        className='btn btn-primary mt-3'
                        onClick={() => {
                            setError(null)
                            fetchOrders()
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className='bg-dark text-white min-vh-100 d-flex justify-content-center align-items-center'>
                <div className='text-center'>
                    <div className='mb-4'>
                        <FaShoppingBag size={60} className='text-muted' />
                    </div>
                    <h2>No Orders Found</h2>
                    <p className='text-muted mb-4'>You haven't placed any orders yet.</p>
                    <Link href='/shop' className='btn btn-primary'>
                        Start Shopping
                    </Link>
                </div>
            </div>
        )
    }

	return (
        <div className='bg-dark text-white min-vh-100 p-4'>
            <div className='container-fluid'>
				{/* Header with white icon and text */}
                <div className='d-flex align-items-center mb-4'>
                    <div className='me-3'>
                        <div className='bg-dark p-2 rounded border border-light'>
                            <FaShoppingBag size={32} className='text-white' />
						</div>
					</div>
					<div>
                        <h1 className='h3 m-0'>My Orders</h1>
                        <p className='text-white-50 m-0'>View and manage your order history</p>
                    </div>
                    <div className='ms-auto'>
                        <button className='btn btn-outline-light' onClick={fetchOrders} title='Refresh Orders'>
                            <FaSyncAlt />
                        </button>
					</div>
				</div>

				{/* Filter area */}
                <div className='bg-dark p-4 rounded mb-4'>
                    <div className='row g-3'>
                        <div className='col-12 col-md-5'>
                            <div className='input-group'>
                                <span className='input-group-text bg-dark text-white border-secondary'>
									<FaSearch />
								</span>
								<input
                                    type='text'
                                    className='form-control bg-dark text-white border-secondary'
                                    placeholder='Search orders...'
									value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
                        <div className='col-12 col-md-3'>
                            <div className='input-group'>
                                <span className='input-group-text bg-dark text-white border-secondary'>
									<FaFilter />
								</span>
								<select
                                    className='form-select bg-dark text-white border-secondary'
									value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
								>
									<option>All Statuses</option>
                                    <option>Pending</option>
									<option>Processing</option>
									<option>Shipped</option>
									<option>Delivered</option>
                                    <option>Cancelled</option>
									<option>Refunded</option>
								</select>
							</div>
						</div>
                        <div className='col-12 col-md-4'>
                            <div className='input-group'>
                                <span className='input-group-text bg-dark text-white border-secondary'>
									<FaRupeeSign />
								</span>
								<select
                                    className='form-select bg-dark text-white border-secondary'
									value={selectedPaymentStatus}
                                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
								>
									<option>All Payment Statuses</option>
									<option>Paid</option>
                                    <option>Pending</option>
                                    <option>Failed</option>
									<option>Refunded</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				{/* Orders table */}
                <div className='table-responsive bg-dark rounded'>
                    <table className='table table-dark table-hover mb-0'>
						<thead>
                            <tr className='border-bottom border-secondary'>
								<th>Order ID</th>
								<th>Product</th>
                                <th>Title</th>
								<th>Status</th>
								<th>Payment</th>
                                <th>Amount</th>
                                <th>Action</th>
                                <th>Details</th>
							</tr>
						</thead>
						<tbody>
							{currentOrders.length > 0 ? (
                                currentOrders.map((order) => {
                                    const productSummary = getOrderSummary(order)

                                    return (
                                        <tr key={order._id} className='border-bottom'>
                                            <td>
                                                <span
                                                    className='d-block fw-medium text-truncate text-secondary'
                                                    style={{ maxWidth: '150px' }}
                                                >
                                                    {order._id}
                                                </span>
                                                <small className='text-white'>{formatDate(order.createdAt)}</small>
                                            </td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    {productSummary.imageUrl ? (
                                                        <div className='me-3' style={{ width: '48px', height: '48px' }}>
                                                            <img
                                                                src={productSummary.imageUrl}
                                                                alt='Product'
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
                                                            style={{ width: '48px', height: '48px' }}
                                                        >
                                                            <FaBox className='text-dark' />
                                                        </div>
                                                    )}
                                                </div>
										</td>
										<td>
                                                <span className='d-block'>{productSummary.title}</span>
                                                {productSummary.count > 1 && (
                                                    <small className='text-white-50'>
                                                        {productSummary.count} items
                                                    </small>
                                                )}
										</td>
										<td>
                                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
												{order.status}
											</span>
										</td>
										<td>
											<span
                                                    className={`badge ${getPaymentStatusBadgeClass(getTransactionStatus(order))}`}
                                                >
                                                    {getTransactionStatus(order)}
                                                </span>
                                            </td>
                                            <td className='text-end'>
                                                <span className='fw-bold'>
                                                    {currency.symbol}
                                                    {order.amount_paid.toFixed(2)}
											</span>
										</td>
										<td>
                                                <small className='text-white'>{formatDate(order.createdAt)}</small>
                                            </td>
                                            <td className='text-center'>
                                                <div className='d-flex justify-content-end'>
											{canCancelOrder(order) && (
												<button
                                                            type='button'
                                                            className='btn btn-sm btn-outline-danger'
													onClick={() => {
                                                                setSelectedOrder(order)
                                                                setShowCancelModal(true)
                                                            }}
                                                        >
                                                            Cancel
												</button>
											)}

											{canRequestRefund(order) && (
												<button
                                                            type='button'
                                                            className='btn btn-sm btn-outline-warning'
													onClick={() => {
                                                                setSelectedOrder(order)
                                                                setShowRefundRequestModal(true)
                                                            }}
                                                        >
                                                            Refund
												</button>
											)}
													</div>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/order/details?id=${order._id}`}
                                                    className='btn btn-sm btn-primary'
                                                >
                                                    View Details
                                                </Link>
										</td>
									</tr>
                                    )
                                })
							) : (
								<tr>
                                    <td colSpan={8} className='text-center py-5'>
                                        <div className='mb-3'>
                                            <FaShoppingBag size={40} className='text-muted' />
                                        </div>
                                        <h5>No orders found</h5>
                                        <p className='text-muted mb-0'>
                                            {loading
                                                ? 'Loading your orders...'
                                                : searchQuery ||
                                                    selectedStatus !== 'All Statuses' ||
                                                    selectedPaymentStatus !== 'All Payment Statuses'
                                                  ? 'Try a different filter'
                                                  : 'Start shopping to see orders here'}
                                        </p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
                {filteredOrders.length > 0 && (
                    <div className='d-flex justify-content-between align-items-center mt-3'>
                        <div className='text-white-50'>
                            Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of{' '}
                            {filteredOrders.length} orders
                        </div>
					<div>
                            <ul className='pagination pagination-sm mb-0'>
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
							<button
                                        className='page-link bg-dark text-white border-secondary'
								onClick={() => setCurrentPage(currentPage - 1)}
							>
								Previous
							</button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
								<button
                                            className='page-link bg-dark text-white border-secondary'
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
								</button>
                                    </li>
							))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
							<button
                                        className='page-link bg-dark text-white border-secondary'
								onClick={() => setCurrentPage(currentPage + 1)}
							>
								Next
							</button>
                                </li>
                            </ul>
                        </div>
						</div>
					)}

                {/* Order Cancellation Modal */}
                {showCancelModal && selectedOrder && (
                    <div className='modal show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className='modal-dialog modal-dialog-centered'>
                            <div className='modal-content bg-dark text-white border-secondary'>
                                <div className='modal-header border-secondary'>
                                    <h5 className='modal-title'>Confirm Order Cancellation</h5>
								<button
                                        type='button'
                                        className='btn-close btn-close-white'
									onClick={() => setShowCancelModal(false)}
								></button>
							</div>
                                <div className='modal-body'>
                                    <p>Are you sure you want to cancel this order?</p>
                                    <div className='d-flex align-items-center mb-3 bg-black p-3 rounded'>
                                        <div className='me-3'>
                                            <FaShoppingBag size={20} />
									</div>
									<div>
                                            <div className='fw-bold'>Order ID: {selectedOrder._id}</div>
                                            <div className='small text-white-50'>
                                                {formatDate(selectedOrder.createdAt)}
									</div>
								</div>
							</div>
                                    <div className='alert alert-warning'>
                                        <small>
                                            Cancelling will immediately stop this order from being processed. If payment
                                            has been made, it may take 5-7 business days for a refund to be processed.
                                        </small>
                                    </div>
                                </div>
                                <div className='modal-footer border-secondary'>
								<button
                                        type='button'
                                        className='btn btn-outline-light'
									onClick={() => setShowCancelModal(false)}
                                        disabled={cancelLoading}
								>
                                        Close
								</button>
								<button
                                        type='button'
                                        className='btn btn-danger'
									onClick={handleOrderCancel}
                                        disabled={cancelLoading}
                                    >
                                        {cancelLoading ? (
                                            <>
                                                <FaSpinner className='fa-spin me-2' />
                                                Processing...
                                            </>
                                        ) : (
                                            'Cancel Order'
                                        )}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Refund Request Modal */}
                {showRefundRequestModal && selectedOrder && (
                    <div className='modal show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className='modal-dialog modal-dialog-centered'>
                            <div className='modal-content bg-dark text-white border-secondary'>
                                <div className='modal-header border-secondary'>
                                    <h5 className='modal-title'>Request Refund</h5>
								<button
                                        type='button'
                                        className='btn-close btn-close-white'
                                        onClick={() => setShowRefundRequestModal(false)}
								></button>
							</div>
                                <div className='modal-body'>
                                    <p>Are you sure you want to request a refund for this order?</p>
                                    <div className='d-flex align-items-center mb-3 bg-black p-3 rounded'>
                                        <div className='me-3'>
                                            <FaShoppingBag size={20} />
									</div>
									<div>
                                            <div className='fw-bold'>Order ID: {selectedOrder._id}</div>
                                            <div className='small text-white-50'>
                                                {formatDate(selectedOrder.createdAt)}
                                            </div>
									</div>
								</div>

                                    <div className='form-group mb-3'>
                                        <label htmlFor='refundReason' className='form-label'>
                                            Reason for Refund *
									</label>
									<textarea
                                            className='form-control bg-dark text-white border-secondary'
                                            id='refundReason'
										rows={4}
										value={refundReason}
                                            onChange={(e) => setRefundReason(e.target.value)}
                                            required
										placeholder="Please explain why you're requesting a refund..."
                                        ></textarea>
                                        <div className='form-text'>
                                            Providing a detailed reason will help us process your request faster.
                                        </div>
                                    </div>

                                    <div className='alert alert-warning'>
                                        <small>
                                            Once approved, refunds typically take 5-7 business days to be credited back
                                            to your original payment method.
									</small>
								</div>
							</div>
                                <div className='modal-footer border-secondary'>
								<button
                                        type='button'
                                        className='btn btn-outline-light'
                                        onClick={() => setShowRefundRequestModal(false)}
                                        disabled={refundLoading}
                                    >
                                        Close
								</button>
								<button
                                        type='button'
                                        className='btn btn-warning'
									onClick={handleRefundRequest}
                                        disabled={refundLoading || !refundReason.trim()}
                                    >
                                        {refundLoading ? (
                                            <>
                                                <FaSpinner className='fa-spin me-2' />
                                                Processing...
                                            </>
                                        ) : (
                                            'Request Refund'
                                        )}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
            </div>
		</div>
    )
}
