'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

// Define cart item interface
interface CartItem {
    _id: string
    product_id: {
        _id: string
        title: string
        description: string
        price: {
            amount: number
            currency: string
        }
        image_id: {
            image_url: string
        }
        creator_id: {
            name: string
        }
    }
    quantity: number
}

// Define cart interface
interface Cart {
    _id: string
    items: CartItem[]
    total: number
    currency: string
}

export default function CartArea() {
    const router = useRouter()
    const [cart, setCart] = useState<Cart | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatingItem, setUpdatingItem] = useState<string | null>(null)

    // Fetch cart data
    const fetchCart = async () => {
        try {
            setLoading(true)
            console.log('Fetching cart data...')
            const response = await fetch('/api/cart')

            console.log('Cart API response status:', response.status)

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Unauthorized access, redirecting to login')
                    // Redirect to login if unauthorized
                    router.push('/login')
                    return
                }

                // Try to get error details from response
                try {
                    const errorData = await response.json()
                    console.error('Cart API error:', errorData)
                    throw new Error(errorData.error || 'Failed to fetch cart')
                } catch (parseError) {
                    console.error('Could not parse error response:', parseError)
                    throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`)
                }
            }

            const data = await response.json()
            console.log('Cart data received:', data)

            if (data.success) {
                setCart(data.data)
            } else {
                console.error('Cart API returned success: false:', data.error)
                setError(data.error || 'Failed to fetch cart')
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Update item quantity
    const updateItemQuantity = async (productId: string, newQuantity: number) => {
        try {
            setUpdatingItem(productId)

            const response = await fetch('/api/cart', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: newQuantity
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // If quantity is 0, remove the item from local state
                if (newQuantity <= 0 && cart) {
                    setCart({
                        ...cart,
                        items: cart.items.filter((item) => item.product_id._id !== productId)
                    })
                    toast.success('Item removed from cart', {
                        position: 'top-right',
                        autoClose: 3000
                    })
                } else {
                    // Otherwise, refresh the cart
                    fetchCart()
                    toast.success('Cart updated', {
                        position: 'top-right',
                        autoClose: 3000
                    })
                }
            } else {
                toast.error(data.error || 'Failed to update cart', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error updating cart:', error)
            toast.error('An error occurred while updating cart', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setUpdatingItem(null)
        }
    }

    // Remove item from cart
    const removeItem = async (productId: string) => {
        try {
            setUpdatingItem(productId)

            const response = await fetch(`/api/cart?productId=${productId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (response.ok && data.success) {
                if (cart) {
                    setCart({
                        ...cart,
                        items: cart.items.filter((item) => item.product_id._id !== productId),
                        total:
                            cart.total -
                            (cart.items.find((item) => item.product_id._id === productId)?.product_id.price.amount || 0)
                    })
                }
                toast.success('Item removed from cart', {
                    position: 'top-right',
                    autoClose: 3000
                })
            } else {
                toast.error(data.error || 'Failed to remove item', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error removing item:', error)
            toast.error('An error occurred while removing item', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setUpdatingItem(null)
        }
    }

    // Clear entire cart
    const clearCart = async () => {
        try {
            setLoading(true)

            const response = await fetch('/api/cart', {
                method: 'DELETE'
            })

            const data = await response.json()

            if (response.ok && data.success) {
                if (cart) {
                    setCart({
                        ...cart,
                        items: [],
                        total: 0
                    })
                }
                toast.success('Cart emptied', {
                    position: 'top-right',
                    autoClose: 3000
                })
            } else {
                toast.error(data.error || 'Failed to clear cart', {
                    position: 'top-right',
                    autoClose: 3000
                })
            }
        } catch (error) {
            console.error('Error clearing cart:', error)
            toast.error('An error occurred while clearing cart', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setLoading(false)
        }
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

    // Render debugging helper
    const getCartDebugInfo = () => {
        console.log('Cart render state:', {
            loading,
            error,
            cart: cart
                ? {
                      _id: cart._id,
                      itemsLength: cart.items?.length,
                      total: cart.total,
                      currency: cart.currency
                  }
                : null
        })

        return null // Don't actually render anything
    }

    // Check authentication status
    const checkAuthStatus = () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            router.push('/login')
            return false
        }
        return true
    }

    // Load cart data on component mount
    useEffect(() => {
        const isAuthenticated = checkAuthStatus()
        if (isAuthenticated) {
            fetchCart()
        }
    }, [])

    return (
        <div
            className='cart__area team-bg section-pt-120 section-pb-120'
            style={{ backgroundImage: `url(/assets/img/bg/team_bg.jpg)` }}
        >
            {/* Debug output */}
            {getCartDebugInfo()}

            <div className='container'>
                {loading ? (
                    <div className='text-center'>
                        <div className='spinner-border text-success' role='status'>
                            <span className='visually-hidden'>Loading...</span>
                        </div>
                        <p className='mt-2 text-white'>Loading cart...</p>
                    </div>
                ) : error ? (
                    <div className='alert alert-danger text-center'>{error}</div>
                ) : cart && Array.isArray(cart.items) && cart.items.length > 0 ? (
                    <div className='row'>
                        <div className='col-lg-8'>
                            <table className='table cart__table'>
                                <thead>
                                    <tr>
                                        <th className='product__thumb'>&nbsp;</th>
                                        <th className='product__name'>Product</th>
                                        <th className='product__price'>Price</th>
                                        <th className='product__quantity'>Quantity</th>
                                        <th className='product__subtotal'>Subtotal</th>
                                        <th className='product__remove'>&nbsp;</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.items.map((item) => (
                                        <tr key={item._id}>
                                            <td className='product__thumb'>
                                                <Link href={`/shop-details/${item.product_id._id}`}>
                                                    <Image
                                                        src={
                                                            item.product_id.image_id?.image_url ||
                                                            '/assets/img/products/product01.jpg'
                                                        }
                                                        alt={item.product_id.title}
                                                        width={70}
                                                        height={72}
                                                    />
                                                </Link>
                                            </td>
                                            <td className='product__name'>
                                                <Link href={`/shop-details/${item.product_id._id}`}>
                                                    {item.product_id.title}
                                                </Link>
                                                <p className='small' style={{ color: '#a0a0a0' }}>
                                                    By {item.product_id.creator_id?.name || 'Unknown Creator'}
                                                </p>
                                            </td>
                                            <td className='product__price'>
                                                {formatCurrency(
                                                    item.product_id.price.amount,
                                                    item.product_id.price.currency
                                                )}
                                            </td>
                                            <td className='product__quantity'>
                                                <div className='shop__details-qty'>
                                                    <form action='#' className='quantity num-block'>
                                                        <input
                                                            type='text'
                                                            className='in-num'
                                                            value={item.quantity}
                                                            readOnly
                                                        />
                                                        <div className='qtybutton-box'>
                                                            <span
                                                                onClick={() =>
                                                                    updateItemQuantity(
                                                                        item.product_id._id,
                                                                        item.quantity + 1
                                                                    )
                                                                }
                                                                className={`plus ${updatingItem === item.product_id._id ? 'disabled' : ''}`}
                                                            >
                                                                <i className='fas fa-angle-up'></i>
                                                            </span>
                                                            <span
                                                                onClick={() =>
                                                                    updateItemQuantity(
                                                                        item.product_id._id,
                                                                        item.quantity - 1
                                                                    )
                                                                }
                                                                className={`minus ${updatingItem === item.product_id._id ? 'disabled' : ''}`}
                                                            >
                                                                <i className='fas fa-angle-down'></i>
                                                            </span>
                                                        </div>
                                                    </form>
                                                </div>
                                            </td>
                                            <td className='product__subtotal'>
                                                {formatCurrency(
                                                    item.product_id.price.amount * item.quantity,
                                                    item.product_id.price.currency
                                                )}
                                            </td>
                                            <td className='product__remove'>
                                                <button
                                                    onClick={() => removeItem(item.product_id._id)}
                                                    className='text-danger border-0 bg-transparent'
                                                    disabled={updatingItem === item.product_id._id}
                                                    style={{ fontSize: '24px', fontWeight: 'bold' }}
                                                >
                                                    {updatingItem === item.product_id._id ? (
                                                        <span
                                                            className='spinner-border spinner-border-sm'
                                                            role='status'
                                                            aria-hidden='true'
                                                        ></span>
                                                    ) : (
                                                        '×'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <td colSpan={6} className='cart__actions'>
                                            <div className='update__cart-btn text-end f-right'>
                                                <button
                                                    onClick={clearCart}
                                                    className='btn btn-danger me-2'
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Clearing...' : 'Clear Cart'}
                                                </button>
                                                <button onClick={fetchCart} className='btn' disabled={loading}>
                                                    {loading ? 'Updating...' : 'Update Cart'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className='col-lg-4'>
                            <div className='cart__collaterals-wrap'>
                                <h2 className='title'>Cart totals</h2>
                                <ul className='list-wrap'>
                                    <li>
                                        Subtotal <span>{formatCurrency(cart.total, cart.currency)}</span>
                                    </li>
                                    <li>
                                        Total{' '}
                                        <span className='amount'>{formatCurrency(cart.total, cart.currency)}</span>
                                    </li>
                                </ul>
                                <Link href='/checkout' className='btn'>
                                    Proceed to checkout
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='text-center'>
                        <h3 className='text-white mb-4'>Your cart is empty</h3>
                        <p className='text-white mb-4'>Add some items to your cart to see them here.</p>
                        <Link href='/shop' className='btn btn-lg'>
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
