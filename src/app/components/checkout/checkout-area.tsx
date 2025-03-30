'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import CouponCodeArea from './coupon-code-area'
import OfferCodeArea from './offer-code-area'
import { v4 as uuidv4 } from 'uuid'

// Define interfaces
interface CartItem {
    _id: string
    product_id: {
        _id: string
        title: string
        price: {
            amount: number
            currency: string
        }
    }
    quantity: number
}

interface Cart {
    _id: string
    items: CartItem[]
    total: number
    currency: string
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
    default: boolean
}

interface AddressForm {
    firstLine: string
    secondLine: string
    pincode: string
    city: string
    state: string
    isDefault: boolean
}

interface Coupon {
    couponId: string
    code: string
    discount: number
}

interface Offer {
    offerId: string
    code: string
    discount: number
}

export default function CheckoutArea() {
    const router = useRouter()
    const [cart, setCart] = useState<Cart | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [orderNotes, setOrderNotes] = useState('')
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addressFormSubmitting, setAddressFormSubmitting] = useState(false)
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
    const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)
    const [newAddressForm, setNewAddressForm] = useState<AddressForm>({
        firstLine: '',
        secondLine: '',
        pincode: '',
        city: '',
        state: '',
        isDefault: true
    })

    // Calculate order total with discounts
    const calculateTotal = () => {
        if (!cart) return { subtotal: 0, discount: 0, total: 0 }

        const subtotal = cart.total

        // Calculate discount from coupon
        let couponDiscount = 0
        if (appliedCoupon) {
            couponDiscount = subtotal * (appliedCoupon.discount / 100)
        }

        // Calculate discount from offer
        let offerDiscount = 0
        if (appliedOffer) {
            offerDiscount = subtotal * (appliedOffer.discount / 100)
        }

        // Total discount (don't allow negative total)
        const totalDiscount = Math.min(subtotal, couponDiscount + offerDiscount)

        // Final total
        const total = subtotal - totalDiscount

        return {
            subtotal,
            discount: totalDiscount,
            total
        }
    }

    // Handle coupon application
    const handleApplyCoupon = (couponData: Coupon | null) => {
        setAppliedCoupon(couponData)
    }

    // Handle offer application
    const handleApplyOffer = (offerData: Offer | null) => {
        setAppliedOffer(offerData)
    }

    // Fetch cart data
    const fetchCart = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/cart')

            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch cart')
            }

            const data = await response.json()

            if (data.success) {
                setCart(data.data)
            } else {
                setError(data.error || 'Failed to fetch cart')
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Fetch user addresses
    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/address')
            console.log('Address API response status:', response.status)

            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if unauthorized
                    console.log('Unauthorized access to address API, redirecting to login')
                    router.push('/login')
                    return
                }
                throw new Error('Failed to fetch addresses')
            }

            const data = await response.json()
            console.log('Address API response:', data)

            if (data.success) {
                setAddresses(data.data || [])

                // Show address form if no addresses
                if (!data.data || data.data.length === 0) {
                    console.log('No addresses found, showing address form')
                    setShowAddressForm(true)
                } else {
                    // Set default address as selected if available
                    const defaultAddress = data.data.find((addr: Address) => addr.default)
                    if (defaultAddress) {
                        setSelectedAddressId(defaultAddress._id)
                    } else if (data.data.length > 0) {
                        setSelectedAddressId(data.data[0]._id)
                    }
                }
            } else {
                console.error('Address API returned success: false:', data.error)
                toast.error(data.error || 'Failed to fetch addresses', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error fetching addresses:', error)
            toast.error('Failed to load your addresses', {
                position: 'top-right',
                autoClose: 3000
            })
        }
    }

    // Handle input change for address form
    const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement

        setNewAddressForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    // Submit new address
    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate form
        if (!newAddressForm.firstLine || !newAddressForm.pincode || !newAddressForm.city || !newAddressForm.state) {
            toast.error('Please fill all required fields', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        try {
            setAddressFormSubmitting(true)
            console.log('Submitting address form...')

            const addressData = {
                address: {
                    firstLine: newAddressForm.firstLine,
                    secondLine: newAddressForm.secondLine || '',
                    pincode: parseInt(newAddressForm.pincode),
                    city: newAddressForm.city,
                    state: newAddressForm.state
                },
                default: newAddressForm.isDefault
            }

            console.log('Address data to submit:', addressData)

            const response = await fetch('/api/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            })

            console.log('Address submission response status:', response.status)

            const data = await response.json()
            console.log('Address submission response:', data)

            if (response.ok) {
                toast.success('Address added successfully', {
                    position: 'top-right',
                    autoClose: 3000
                })

                // Refresh addresses
                await fetchAddresses()

                // Set the new address as selected
                if (data.address && data.address._id) {
                    setSelectedAddressId(data.address._id)
                }

                // Hide the form
                setShowAddressForm(false)

                // Reset form
                setNewAddressForm({
                    firstLine: '',
                    secondLine: '',
                    pincode: '',
                    city: '',
                    state: '',
                    isDefault: true
                })
            } else {
                toast.error(data.error || 'Failed to add address', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error adding address:', error)
            toast.error('An error occurred while adding address', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setAddressFormSubmitting(false)
        }
    }

    // Format address for display
    const formatAddress = (address: Address) => {
        const addr = address.address
        return `${addr.firstLine}, ${addr.secondLine ? addr.secondLine + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}`
    }

    // Format currency
    const formatCurrency = (amount: number, currency: string = 'USD') => {
        const currencySymbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹'
        }

        const symbol = currencySymbols[currency] || currency
        return `${symbol}${amount.toFixed(2)}`
    }

    // Handle order submission
    const handlePlaceOrder = async () => {
        if (!cart || cart.items.length === 0) {
            toast.error('Your cart is empty', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        if (!selectedAddressId) {
            toast.error('Please select a delivery address', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        try {
            setSubmitting(true)
            console.log('Processing order...')

            // Calculate total amount with discounts applied
            const { total } = calculateTotal()

            // Step 1: Create a transaction record first
            const transactionResponse = await fetch('/api/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: total,
                    currency: cart.currency || 'INR'
                })
            })

            if (!transactionResponse.ok) {
                const errorData = await transactionResponse.json()
                throw new Error(errorData.error || 'Failed to create transaction')
            }

            const transactionData = await transactionResponse.json()
            console.log('Transaction created:', transactionData)

            if (!transactionData.success || !transactionData.data || !transactionData.data._id) {
                throw new Error('Invalid transaction response')
            }

            // Get the transaction ID from the response
            const transactionId = transactionData.data._id

            // Step 2: Create the order with the transaction ID
            const orderData = {
                product_ordered: cart.items.map((item) => item.product_id._id),
                address_id: selectedAddressId,
                size_ordered: cart.items.map(() => 'M'), // Default to 'M' size for all items
                quantity_ordered: cart.items.map((item) => item.quantity),
                coupon_used: appliedCoupon ? [appliedCoupon.couponId] : [],
                offer_used: appliedOffer ? [appliedOffer.offerId] : [],
                transaction_id: transactionId // Use the MongoDB ObjectId from the transaction
            }

            // Log the order data for debugging
            console.log('Order data prepared:', orderData)

            // Send order request
            const orderResponse = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            })

            console.log('Order API response status:', orderResponse.status)

            // Try to parse the response data
            let orderResponseData
            try {
                orderResponseData = await orderResponse.json()
                console.log('Order API response data:', orderResponseData)
            } catch (parseError) {
                console.error('Error parsing order response:', parseError)
                throw new Error(`Failed to parse response: ${orderResponse.status} ${orderResponse.statusText}`)
            }

            if (orderResponse.ok && orderResponseData.success) {
                console.log('Order placed successfully, clearing cart...')

                // Update transaction with order ID if needed
                try {
                    await fetch('/api/transaction', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: transactionId,
                            order_id: orderResponseData.data._id,
                            status: 'successful'
                        })
                    })
                } catch (updateError) {
                    console.error('Error updating transaction with order ID:', updateError)
                    // Continue even if transaction update fails
                }

                // Clear cart after successful order
                try {
                    const clearCartResponse = await fetch('/api/cart', { method: 'DELETE' })
                    const clearCartData = await clearCartResponse.json()
                    console.log('Cart cleared response:', clearCartData)
                } catch (clearCartError) {
                    console.error('Error clearing cart:', clearCartError)
                    // Continue even if cart clearing fails
                }

                toast.success('Order placed successfully!', {
                    position: 'top-right',
                    autoClose: 3000
                })

                // Instead of automatically redirecting, create a success page with options
                // Store the order ID in localStorage
                if (orderResponseData.data && orderResponseData.data._id) {
                    localStorage.setItem('lastOrderId', orderResponseData.data._id)
                }

                // Redirect to success page with options
                router.push('/checkout/success')
            } else {
                console.error('Order API error:', orderResponseData.error || 'Unknown error')

                // If order fails, mark transaction as failed
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
                } catch (updateError) {
                    console.error('Error updating transaction as failed:', updateError)
                }

                toast.error(orderResponseData.error || 'Failed to place order', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('An error occurred while placing your order', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setSubmitting(false)
        }
    }

    // Load data on component mount
    useEffect(() => {
        fetchCart()
        fetchAddresses()
    }, [])

    if (loading) {
        return (
            <div className='checkout__area section-pt-120 section-pb-120'>
                <div className='container'>
                    <div className='text-center'>
                        <div className='spinner-border text-success' role='status'>
                            <span className='visually-hidden'>Loading...</span>
                        </div>
                        <p className='mt-2 text-white'>Loading checkout information...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='checkout__area section-pt-120 section-pb-120'>
                <div className='container'>
                    <div className='alert alert-danger text-center'>
                        {error}
                        <div className='mt-3'>
                            <button className='btn' onClick={() => router.push('/cart')}>
                                Return to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className='checkout__area section-pt-120 section-pb-120'>
                <div className='container'>
                    <div className='text-center'>
                        <h3 className='text-white mb-4'>Your cart is empty</h3>
                        <p className='text-white mb-4'>Add some items to your cart before proceeding to checkout.</p>
                        <button className='btn' onClick={() => router.push('/shop')}>
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Calculate totals
    const { subtotal, discount, total } = calculateTotal()

    return (
        <div className='checkout__area section-pt-120 section-pb-120'>
            <div className='container'>
                <div className='row'>
                    <div className='col-12 mb-4'>
                        <div
                            className='discount-code-container'
                            style={{
                                backgroundColor: '#1a1a1a',
                                borderRadius: '15px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}
                        >
                            <h4 className='mb-3 text-white'>Apply Discounts</h4>
                            <CouponCodeArea
                                onApplyCoupon={handleApplyCoupon}
                                cartItems={cart.items.map((item) => item.product_id._id)}
                            />
                            <OfferCodeArea
                                onApplyOffer={handleApplyOffer}
                                cartItems={cart.items.map((item) => item.product_id._id)}
                            />
                        </div>
                    </div>

                    <div className='col-lg-7'>
                        <div className='customer__form-wrap'>
                            <span className='title'>Delivery Address</span>

                            {/* Address Selection or Form Toggle */}
                            {addresses.length > 0 && (
                                <div className='mb-4'>
                                    <div className='form-grp select-grp'>
                                        <label htmlFor='address-select'>Select Address *</label>
                                        <select
                                            id='address-select'
                                            className='address-select'
                                            value={selectedAddressId}
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                        >
                                            <option value=''>Select a delivery address</option>
                                            {addresses.map((address) => (
                                                <option key={address._id} value={address._id}>
                                                    {formatAddress(address)} {address.default ? ' (Default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='text-end mt-3'>
                                        <button
                                            className='btn btn-sm'
                                            onClick={() => setShowAddressForm(!showAddressForm)}
                                        >
                                            {showAddressForm ? 'Cancel' : 'Add New Address'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Address Form */}
                            {showAddressForm && (
                                <div
                                    className='address-form-container p-4 mb-4'
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}
                                >
                                    <h4 className='mb-3'>
                                        {addresses.length > 0 ? 'Add New Address' : 'Add Delivery Address'}
                                    </h4>
                                    <form onSubmit={handleAddressSubmit}>
                                        <div className='form-grp'>
                                            <label htmlFor='firstLine'>Address Line 1 *</label>
                                            <input
                                                type='text'
                                                id='firstLine'
                                                name='firstLine'
                                                value={newAddressForm.firstLine}
                                                onChange={handleAddressInputChange}
                                                placeholder='House no., Street name'
                                                required
                                            />
                                        </div>
                                        <div className='form-grp'>
                                            <label htmlFor='secondLine'>Address Line 2 (Optional)</label>
                                            <input
                                                type='text'
                                                id='secondLine'
                                                name='secondLine'
                                                value={newAddressForm.secondLine}
                                                onChange={handleAddressInputChange}
                                                placeholder='Apartment, suite, unit, etc.'
                                            />
                                        </div>
                                        <div className='row'>
                                            <div className='col-md-6'>
                                                <div className='form-grp'>
                                                    <label htmlFor='city'>City *</label>
                                                    <input
                                                        type='text'
                                                        id='city'
                                                        name='city'
                                                        value={newAddressForm.city}
                                                        onChange={handleAddressInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className='col-md-6'>
                                                <div className='form-grp'>
                                                    <label htmlFor='state'>State *</label>
                                                    <input
                                                        type='text'
                                                        id='state'
                                                        name='state'
                                                        value={newAddressForm.state}
                                                        onChange={handleAddressInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='form-grp'>
                                            <label htmlFor='pincode'>Pincode *</label>
                                            <input
                                                type='text'
                                                id='pincode'
                                                name='pincode'
                                                value={newAddressForm.pincode}
                                                onChange={handleAddressInputChange}
                                                pattern='[0-9]*'
                                                required
                                            />
                                        </div>
                                        <div className='form-grp'>
                                            <div className='form-check'>
                                                <input
                                                    type='checkbox'
                                                    className='form-check-input'
                                                    id='isDefault'
                                                    name='isDefault'
                                                    checked={newAddressForm.isDefault}
                                                    onChange={handleAddressInputChange}
                                                />
                                                <label className='form-check-label' htmlFor='isDefault'>
                                                    Set as default address
                                                </label>
                                            </div>
                                        </div>
                                        <div className='form-grp'>
                                            <button type='submit' className='btn' disabled={addressFormSubmitting}>
                                                {addressFormSubmitting ? 'Saving...' : 'Save Address'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <span className='title title-two'>Additional Information</span>
                            <div className='form-grp'>
                                <label htmlFor='note'>Order notes (optional)</label>
                                <textarea
                                    id='note'
                                    placeholder='Notes about your order, e.g. special notes for delivery.'
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className='col-lg-5'>
                        <div className='order__info-wrap'>
                            <h2 className='title'>YOUR ORDER</h2>
                            <ul className='list-wrap'>
                                <li className='title'>
                                    Product <span>Subtotal</span>
                                </li>
                                {cart.items.map((item) => (
                                    <li key={item._id}>
                                        {item.product_id.title} × {item.quantity}
                                        <span>
                                            {formatCurrency(
                                                item.product_id.price.amount * item.quantity,
                                                item.product_id.price.currency
                                            )}
                                        </span>
                                    </li>
                                ))}
                                <li>
                                    Subtotal <span>{formatCurrency(subtotal, cart.currency)}</span>
                                </li>

                                {/* Display discount details if there are any */}
                                {discount > 0 && (
                                    <li style={{ color: '#22c55e' }}>
                                        Discount
                                        <span>-{formatCurrency(discount, cart.currency)}</span>
                                    </li>
                                )}

                                <li>
                                    Total <span>{formatCurrency(total, cart.currency)}</span>
                                </li>

                                {/* Display applied discounts info */}
                                {(appliedCoupon || appliedOffer) && (
                                    <li className='discount-info' style={{ fontSize: '14px', color: '#22c55e' }}>
                                        <div>
                                            {appliedCoupon && (
                                                <div>
                                                    Coupon: {appliedCoupon.code} ({appliedCoupon.discount}% off)
                                                </div>
                                            )}
                                            {appliedOffer && (
                                                <div>
                                                    Offer: {appliedOffer.code} ({appliedOffer.discount}% off)
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )}
                            </ul>
                            <p>
                                Your personal data will be used to process your order, support your experience
                                throughout this website, and for other purposes described in our{' '}
                                <a href='#'>privacy policy.</a>
                            </p>
                            <button
                                className='btn'
                                onClick={handlePlaceOrder}
                                disabled={submitting || !selectedAddressId || cart.items.length === 0}
                            >
                                {submitting ? 'Processing...' : 'Place order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
