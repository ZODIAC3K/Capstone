'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-toastify'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import BreadcrumbArea from '../components/breadcrumb/breadcrumb-area'
import brd_bg from '@/assets/img/bg/breadcrumb_bg01.jpg'
import brd_img from '@/assets/img/others/breadcrumb_img02.png'
import CartArea from '../components/cart/cart-area'
import BrandArea from '../components/brand/brand-area'

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

const CartPage = () => {
    const router = useRouter()
    const [cart, setCart] = useState<Cart | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatingItem, setUpdatingItem] = useState<string | null>(null)

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
                        items: cart.items.filter((item) => item.product_id._id !== productId)
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
                        items: []
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

    // Increase item quantity
    const increaseQuantity = (productId: string, currentQuantity: number) => {
        updateItemQuantity(productId, currentQuantity + 1)
    }

    // Decrease item quantity
    const decreaseQuantity = (productId: string, currentQuantity: number) => {
        if (currentQuantity > 1) {
            updateItemQuantity(productId, currentQuantity - 1)
        } else {
            removeItem(productId)
        }
    }

    // Load cart data on component mount
    useEffect(() => {
        fetchCart()
    }, [])

    // Get currency symbol
    const getCurrencySymbol = (currencyCode: string) => {
        const currencyMap: { [key: string]: string } = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            INR: '₹',
            CNY: '¥',
            RUB: '₽',
            AUD: 'A$',
            CAD: 'C$',
            BRL: 'R$'
        }

        return currencyMap[currencyCode] || currencyCode
    }

    // Get formatted price
    const formatPrice = (amount: number, currency: string) => {
        return `${getCurrencySymbol(currency)} ${amount.toFixed(2)}`
    }

    return (
        <Wrapper>
            {/* header start */}
            <Header />
            {/* header end */}

            {/* main area start */}
            <main className='main--area'>
                {/* cart area start */}
                <CartArea />
                {/* cart area end */}
                <BrandArea />
            </main>
            {/* main area end */}

            {/* footer start */}
            <Footer />
            {/* footer end */}
        </Wrapper>
    )
}

export default CartPage
