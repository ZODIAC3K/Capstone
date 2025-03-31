'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaSyncAlt, FaTimes, FaShoppingBag, FaRupeeSign } from 'react-icons/fa'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Define interfaces for the API response data
interface Address {
    _id: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
}

interface ProductImage {
    _id: string
    image_url: string
}

interface Product {
    _id: string
    title: string
    price: {
        amount: number
        currency: string
    }
    image_id: ProductImage
}

interface Transaction {
    _id: string
    amount: number
    status: string
    payment_method: string
}

interface User {
    _id: string
    fname: string
    lname: string
    email: string
}

interface ApiOrder {
    _id: string
    user_id: User
    product_ordered: Product[]
    size_ordered: string[]
    quantity_ordered: number[]
    total_amount: number
    amount_paid: number
    address: Address
    transaction_id: Transaction
    tracking_info?: string
    status: string
    createdAt: string
    updatedAt: string
}

export default function OrderManagementPage() {
    // Currency configuration
    const [currency, setCurrency] = useState({
        symbol: '₹',
        code: 'INR'
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('All Statuses')
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All Payment Statuses')
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [showTrackingModal, setShowTrackingModal] = useState(false)
    const [trackingInfo, setTrackingInfo] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [filteredOrders, setFilteredOrders] = useState<ApiOrder[]>([])
    const [orders, setOrders] = useState<ApiOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const ordersPerPage = 10

    // Fetch orders from the API
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('Fetching orders...')

                const response = await fetch('/api/order', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                console.log('Orders API response status:', response.status)

                if (!response.ok) {
                    let errorMessage = `Error ${response.status}: ${response.statusText}`
                    try {
                        const errorData = await response.json()
                        console.error('Error response:', errorData)
                        if (errorData.error) {
                            errorMessage = errorData.error
                        }
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError)
                    }
                    throw new Error(errorMessage)
                }

                const data = await response.json()
                console.log('Orders fetched successfully:', data.data?.orders?.length || 0, 'orders')

                if (data.success && data.data && Array.isArray(data.data.orders)) {
                    setOrders(data.data.orders)
                    setFilteredOrders(data.data.orders)
                } else {
                    throw new Error(data.error || 'Failed to fetch orders: Invalid server response format')
                }
            } catch (err) {
                console.error('Error fetching orders:', err)
                setError(err instanceof Error ? err.message : 'An error occurred while fetching orders')
                toast.error('Failed to load orders. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    // Filter orders based on search query and selected filters
    useEffect(() => {
        let result = [...orders]

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (order) =>
                    order._id.toLowerCase().includes(query) ||
                    `${order.user_id.fname} ${order.user_id.lname}`.toLowerCase().includes(query) ||
                    order.user_id.email.toLowerCase().includes(query) ||
                    order.product_ordered.some((p) => p.title.toLowerCase().includes(query))
            )
        }

        // Filter by status
        if (selectedStatus !== 'All Statuses') {
            result = result.filter((order) => order.status === selectedStatus.toLowerCase())
        }

        // Filter by payment status
        if (selectedPaymentStatus !== 'All Payment Statuses') {
            result = result.filter((order) => {
                // Check if transaction_id exists and has a status property
                if (!order.transaction_id || !order.transaction_id.status) {
                    // If looking for failed/pending payment status, include orders with missing transaction
                    return selectedPaymentStatus.toLowerCase() === 'failed'
                }
                return order.transaction_id.status.toLowerCase() === selectedPaymentStatus.toLowerCase()
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

    // Handle order status update
    const handleStatusUpdate = async (newStatus: string) => {
        if (selectedOrder) {
            try {
                console.log('Updating order status:', { orderId: selectedOrder._id, newStatus })

                // Create request body
                const requestBody = {
                    id: selectedOrder._id,
                    status: newStatus
                }

                console.log('Request payload:', requestBody)

                // Send the API request
                const response = await fetch('/api/order', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestBody)
                })

                console.log('API Response status:', response.status)

                // Handle non-2xx responses
                if (!response.ok) {
                    let errorMessage = `Error ${response.status}: ${response.statusText}`
                    try {
                        const errorData = await response.json()
                        console.error('Error response:', errorData)
                        if (errorData.error) {
                            errorMessage = errorData.error
                        }
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError)
                    }
                    throw new Error(errorMessage)
                }

                // Process successful response
                try {
                    const data = await response.json()
                    console.log('Success response:', data)

                    if (data.success && data.data && data.data.order) {
                        // Update local state with new order data
                        const updatedOrders = orders.map((order) =>
                            order._id === selectedOrder._id ? data.data.order : order
                        )
                        setOrders(updatedOrders)

                        toast.success(`Order status updated to ${newStatus}`)
                        setShowStatusModal(false)
                    } else {
                        throw new Error(
                            data.error || 'Failed to update order status: Server response missing order data'
                        )
                    }
                } catch (parseError) {
                    console.error('Failed to parse success response:', parseError)
                    throw new Error('Failed to process server response')
                }
            } catch (err) {
                console.error('Error updating order status:', err)
                toast.error(err instanceof Error ? err.message : 'Failed to update order status')
            }
        }
    }

    // Handle tracking info update
    const handleTrackingUpdate = async () => {
        if (selectedOrder && trackingInfo !== undefined) {
            try {
                console.log('Updating tracking info:', { orderId: selectedOrder._id, trackingInfo })

                // Create request body
                const requestBody = {
                    id: selectedOrder._id,
                    tracking_info: trackingInfo
                }

                console.log('Request payload:', requestBody)

                // Send the API request
                const response = await fetch('/api/order', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestBody)
                })

                console.log('API Response status:', response.status)

                // Handle non-2xx responses
                if (!response.ok) {
                    let errorMessage = `Error ${response.status}: ${response.statusText}`
                    try {
                        const errorData = await response.json()
                        console.error('Error response:', errorData)
                        if (errorData.error) {
                            errorMessage = errorData.error
                        }
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError)
                    }
                    throw new Error(errorMessage)
                }

                // Process successful response
                try {
                    const data = await response.json()
                    console.log('Success response:', data)

                    if (data.success && data.data && data.data.order) {
                        // Update local state with new order data
                        const updatedOrders = orders.map((order) =>
                            order._id === selectedOrder._id ? data.data.order : order
                        )
                        setOrders(updatedOrders)

                        toast.success('Tracking information updated')
                        setShowTrackingModal(false)
                        setTrackingInfo('')
                    } else {
                        throw new Error(
                            data.error || 'Failed to update tracking information: Server response missing order data'
                        )
                    }
                } catch (parseError) {
                    console.error('Failed to parse success response:', parseError)
                    throw new Error('Failed to process server response')
                }
            } catch (err) {
                console.error('Error updating tracking info:', err)
                toast.error(err instanceof Error ? err.message : 'Failed to update tracking information')
            }
        }
    }

    // CSS classes for status badges
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'processing':
                return 'bg-warning text-dark'
            case 'shipped':
                return 'bg-info text-white'
            case 'delivered':
                return 'bg-success text-white'
            case 'cancelled':
                return 'bg-danger text-white'
            default:
                return 'bg-secondary text-white'
        }
    }

    // CSS classes for payment status badges
    const getPaymentStatusBadgeClass = (status: string | undefined) => {
        if (!status) return 'bg-secondary text-white'

        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-success text-white'
            case 'failed':
                return 'bg-danger text-white'
            case 'pending':
                return 'bg-warning text-dark'
            default:
                return 'bg-secondary text-white'
        }
    }

    // Get formatted payment status text
    const getPaymentStatusText = (status: string | undefined) => {
        if (!status) return 'Unknown'
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    // Format date
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A'

        try {
            const date = new Date(dateString)

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date'
            }

            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            console.error('Error formatting date:', error)
            return 'Invalid date'
        }
    }

    // Get product name for order
    const getProductNames = (order: ApiOrder) => {
        if (!order.product_ordered || !Array.isArray(order.product_ordered) || order.product_ordered.length === 0) {
            return 'N/A'
        }

        try {
            if (order.product_ordered.length === 1) {
                return order.product_ordered[0]?.title || 'Unnamed product'
            }

            return `${order.product_ordered[0]?.title || 'Unnamed product'} +${order.product_ordered.length - 1} more`
        } catch (error) {
            console.error('Error getting product names:', error)
            return 'Error displaying products'
        }
    }

    // Get payment method text
    const getPaymentMethod = (order: ApiOrder) => {
        if (!order.transaction_id || !order.transaction_id.payment_method) {
            return 'N/A'
        }
        return order.transaction_id.payment_method
    }

    if (loading) {
        return (
            <div className='bg-dark text-white min-vh-100 p-4 d-flex justify-content-center align-items-center'>
                <div className='spinner-border text-success' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='bg-dark text-white min-vh-100 p-4 d-flex flex-column justify-content-center align-items-center'>
                <div className='alert alert-danger' role='alert'>
                    {error}
                </div>
                <button className='btn btn-success mt-3' onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className='bg-dark text-white min-vh-100 p-4'>
            <ToastContainer theme='dark' />
            <div className='container-fluid'>
                {/* Header with white icon and text */}
                <div className='d-flex align-items-center mb-4'>
                    <div className='me-3'>
                        <div className='bg-dark p-2 rounded border border-light'>
                            <FaShoppingBag size={32} className='text-white' />
                        </div>
                    </div>
                    <div>
                        <h1 className='h3 m-0'>Manage Orders</h1>
                        <p className='text-white-50 m-0'>View and manage customer orders</p>
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
                                    <option>Processing</option>
                                    <option>Shipped</option>
                                    <option>Delivered</option>
                                    <option>Cancelled</option>
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
                                    <option>Completed</option>
                                    <option>Pending</option>
                                    <option>Failed</option>
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
                                <th>Customer</th>
                                <th>Products</th>
                                <th>Total</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <tr key={order._id} className='border-bottom border-secondary'>
                                        <td>{order._id.substring(order._id.length - 8)}</td>
                                        <td>
                                            <div>
                                                {order.user_id.fname} {order.user_id.lname}
                                            </div>
                                            <div className='text-white-50 small'>{order.user_id.email}</div>
                                        </td>
                                        <td>{getProductNames(order)}</td>
                                        <td>
                                            {currency.symbol}
                                            {order.amount_paid.toFixed(2)}
                                        </td>
                                        <td>{formatDate(order.createdAt)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            {order.tracking_info && (
                                                <div className='text-white-50 small mt-1'>
                                                    Tracking: {order.tracking_info}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${getPaymentStatusBadgeClass(order?.transaction_id?.status)}`}
                                            >
                                                {getPaymentStatusText(order?.transaction_id?.status)}
                                            </span>
                                            <div className='text-white-50 small mt-1'>{getPaymentMethod(order)}</div>
                                        </td>
                                        <td>
                                            {order.status !== 'cancelled' ? (
                                                <div className='d-flex gap-2'>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order)
                                                            setShowStatusModal(true)
                                                        }}
                                                        className='btn btn-sm btn-dark border-light'
                                                        aria-label='Update status'
                                                        title='Update Status'
                                                    >
                                                        <FaSyncAlt />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order)
                                                            setTrackingInfo(order.tracking_info || '')
                                                            setShowTrackingModal(true)
                                                        }}
                                                        className='btn btn-sm btn-info'
                                                        aria-label='Update tracking'
                                                        title='Update Tracking'
                                                    >
                                                        <i className='fas fa-truck'></i>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='text-white-50'>No actions available</div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className='text-center py-4 text-white-50'>
                                        No orders found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className='d-flex justify-content-between align-items-center mt-3 text-white-50'>
                    <div>
                        {filteredOrders.length > 0
                            ? `Showing ${indexOfFirstOrder + 1} to ${Math.min(
                                  indexOfLastOrder,
                                  filteredOrders.length
                              )} of ${filteredOrders.length} orders`
                            : 'No orders found'}
                    </div>
                    {totalPages > 1 && (
                        <div className='d-flex gap-2'>
                            <button
                                className={`btn ${currentPage === 1 ? 'btn-dark text-muted' : 'btn-dark text-white'}`}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Show a window of 5 pages around the current page
                                let startPage = Math.max(1, currentPage - 2)
                                let endPage = Math.min(totalPages, startPage + 4)

                                // Adjust the start if we're near the end
                                if (endPage - startPage < 4) {
                                    startPage = Math.max(1, endPage - 4)
                                }

                                return startPage + i
                            })
                                .filter((page) => page <= totalPages)
                                .map((page) => (
                                    <button
                                        key={page}
                                        className={`btn ${
                                            currentPage === page ? 'btn-success' : 'btn-dark text-white'
                                        }`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            <button
                                className={`btn ${
                                    currentPage === totalPages ? 'btn-dark text-muted' : 'btn-dark text-white'
                                }`}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className='modal fade show d-block' tabIndex={-1} role='dialog' aria-modal='true'>
                    <div className='modal-dialog modal-dialog-centered'>
                        <div className='modal-content bg-dark text-white border border-light'>
                            <div className='modal-header border-0'>
                                <h5 className='modal-title'>Update Order Status</h5>
                                <button
                                    type='button'
                                    className='btn-close btn-close-white'
                                    onClick={() => setShowStatusModal(false)}
                                ></button>
                            </div>
                            <div className='modal-body pt-0'>
                                <div className='list-group list-group-flush bg-dark'>
                                    <button
                                        onClick={() => handleStatusUpdate('processing')}
                                        className='list-group-item list-group-item-action bg-dark text-white border-secondary py-3'
                                    >
                                        <div className='d-flex align-items-center'>
                                            <span className='badge bg-warning'>&nbsp;</span>
                                            <span className='ms-2'>Processing</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('shipped')}
                                        className='list-group-item list-group-item-action bg-dark text-white border-secondary py-3'
                                    >
                                        <div className='d-flex align-items-center'>
                                            <span className='badge bg-info'>&nbsp;</span>
                                            <span className='ms-2'>Shipped</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('delivered')}
                                        className='list-group-item list-group-item-action bg-dark text-white border-secondary py-3'
                                    >
                                        <div className='d-flex align-items-center'>
                                            <span className='badge bg-success'>&nbsp;</span>
                                            <span className='ms-2'>Delivered</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        className='list-group-item list-group-item-action bg-dark text-white border-secondary py-3 text-danger'
                                    >
                                        <div className='d-flex align-items-center'>
                                            <span className='badge bg-danger'>&nbsp;</span>
                                            <span className='ms-2'>Cancel Order</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div className='modal-footer border-0'>
                                <button className='btn btn-secondary' onClick={() => setShowStatusModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracking Update Modal */}
            {showTrackingModal && (
                <div className='modal fade show d-block' tabIndex={-1} role='dialog' aria-modal='true'>
                    <div className='modal-dialog modal-dialog-centered'>
                        <div className='modal-content bg-dark text-white border border-light'>
                            <div className='modal-header border-0'>
                                <h5 className='modal-title'>Update Tracking Information</h5>
                                <button
                                    type='button'
                                    className='btn-close btn-close-white'
                                    onClick={() => setShowTrackingModal(false)}
                                ></button>
                            </div>
                            <div className='modal-body'>
                                <div className='mb-3'>
                                    <label className='form-label text-white'>Tracking Number or URL</label>
                                    <input
                                        type='text'
                                        value={trackingInfo}
                                        onChange={(e) => setTrackingInfo(e.target.value)}
                                        placeholder='Enter tracking information'
                                        className='form-control bg-dark text-white border-secondary'
                                    />
                                    <small className='text-white-50 mt-1'>
                                        This will be visible to the customer to track their order
                                    </small>
                                </div>
                            </div>
                            <div className='modal-footer border-0'>
                                <button className='btn btn-secondary' onClick={() => setShowTrackingModal(false)}>
                                    Cancel
                                </button>
                                <button className='btn btn-success' onClick={handleTrackingUpdate}>
                                    Update Tracking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal backdrop */}
            {(showStatusModal || showTrackingModal) && <div className='modal-backdrop fade show'></div>}
        </div>
    )
}
