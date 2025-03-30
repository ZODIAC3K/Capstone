'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface CouponCodeAreaProps {
    onApplyCoupon: (coupon: { couponId: string; code: string; discount: number } | null) => void
    cartItems: string[]
}

export default function CouponCodeArea({ onApplyCoupon, cartItems }: CouponCodeAreaProps) {
    const [openForm, setOpenForm] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [isValidating, setIsValidating] = useState(false)
    const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number } | null>(null)

    const handleToggleForm = () => {
        if (appliedCoupon) return // Don't toggle if coupon already applied
        setOpenForm(!openForm)
    }

    const handleApplyCoupon = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        try {
            setIsValidating(true)

            // First, verify the coupon code
            const verifyResponse = await fetch('/api/coupon/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ coupon_code: couponCode })
            })

            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json()
                toast.error(errorData.error || 'Invalid coupon code', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // If verified, get the coupon details
            const couponResponse = await fetch('/api/coupon')
            const couponData = await couponResponse.json()

            if (!couponData.coupons || !Array.isArray(couponData.coupons)) {
                toast.error('Failed to fetch coupon details', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // Find the coupon in the list
            const foundCoupon = couponData.coupons.find((c: any) => c.code === couponCode)

            if (!foundCoupon) {
                toast.error('Coupon not found', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // Save the applied coupon locally
            setAppliedCoupon({
                id: foundCoupon._id,
                code: foundCoupon.code,
                discount: foundCoupon.discount
            })

            // Pass the coupon details to parent component
            onApplyCoupon({
                couponId: foundCoupon._id,
                code: foundCoupon.code,
                discount: foundCoupon.discount
            })

            toast.success(`Coupon "${foundCoupon.code}" applied: ${foundCoupon.discount}% off`, {
                position: 'top-right',
                autoClose: 3000
            })

            // Close the form
            setOpenForm(false)
        } catch (error) {
            console.error('Error applying coupon:', error)
            toast.error('Failed to apply coupon. Please try again.', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setIsValidating(false)
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
        onApplyCoupon(null)
        toast.info('Coupon removed', {
            position: 'top-right',
            autoClose: 3000
        })
    }

    return (
        <div className='coupon__code-area mb-3'>
            <div className='coupon__code-wrap'>
                {appliedCoupon ? (
                    <div className='applied-coupon p-3' style={{ backgroundColor: '#121212', borderRadius: '10px' }}>
                        <div className='d-flex align-items-center justify-content-between'>
                            <div>
                                <span className='text-white'>
                                    <i className='fas fa-tag me-2'></i> Applied Coupon:{' '}
                                    <span style={{ color: '#3cf281' }}>{appliedCoupon.code}</span> (
                                    {appliedCoupon.discount}% off)
                                </span>
                            </div>
                            <button
                                className='btn btn-sm'
                                onClick={handleRemoveCoupon}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '4px 10px'
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className='mb-2 d-flex align-items-center'>
                            <i className='fas fa-tag me-2'></i>
                            <span className='text-white'>Have a coupon?</span>
                            <a
                                href='#'
                                className='ms-2'
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleToggleForm()
                                }}
                                style={{ color: '#3cf281', textDecoration: 'none' }}
                            >
                                Click here to enter your code
                            </a>
                        </p>
                        {openForm && (
                            <div className='coupon__code mb-3'>
                                <form onSubmit={handleApplyCoupon} className='d-flex'>
                                    <input
                                        type='text'
                                        placeholder='Coupon code'
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={isValidating}
                                        className='form-control me-2 flex-grow-1'
                                        style={{
                                            backgroundColor: 'white',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            height: '50px'
                                        }}
                                    />
                                    <button
                                        type='submit'
                                        className='btn'
                                        disabled={isValidating}
                                        style={{
                                            backgroundColor: '#3cf281',
                                            color: '#121212',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            padding: '10px 20px'
                                        }}
                                    >
                                        {isValidating ? 'Applying...' : 'Apply Coupon'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
