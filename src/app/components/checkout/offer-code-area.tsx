'use client'
import { useState } from 'react'
import { toast } from 'react-toastify'

interface OfferCodeAreaProps {
    onApplyOffer: (offer: { offerId: string; code: string; discount: number } | null) => void
    cartItems: string[]
}

export default function OfferCodeArea({ onApplyOffer, cartItems }: OfferCodeAreaProps) {
    const [openForm, setOpenForm] = useState(false)
    const [offerCode, setOfferCode] = useState('')
    const [isValidating, setIsValidating] = useState(false)
    const [appliedOffer, setAppliedOffer] = useState<{ id: string; code: string; discount: number } | null>(null)

    const handleToggleForm = () => {
        if (appliedOffer) return // Don't toggle if offer already applied
        setOpenForm(!openForm)
    }

    const handleApplyOffer = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!offerCode.trim()) {
            toast.error('Please enter an offer code', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        if (!cartItems || cartItems.length === 0) {
            toast.error('Your cart is empty', {
                position: 'top-right',
                autoClose: 3000
            })
            return
        }

        try {
            setIsValidating(true)

            // Verify if the offer code is valid for any product in the cart
            const verificationPromises = cartItems.map((productId) =>
                fetch('/api/offer/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        offer_code: offerCode,
                        product_id: productId
                    })
                })
            )

            const verifyResponses = await Promise.all(verificationPromises)

            // Check if at least one product is valid for the offer
            const isValid = verifyResponses.some((response) => response.ok)

            if (!isValid) {
                toast.error('This offer code is not applicable for the items in your cart', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // Get offer details
            const offerResponse = await fetch('/api/offer')
            const offerData = await offerResponse.json()

            if (!offerData || !Array.isArray(offerData)) {
                toast.error('Failed to fetch offer details', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // Find the offer in the list
            const foundOffer = offerData.find((o: any) => o.code === offerCode)

            if (!foundOffer) {
                toast.error('Offer not found', {
                    position: 'top-right',
                    autoClose: 3000
                })
                return
            }

            // Save the applied offer locally
            setAppliedOffer({
                id: foundOffer._id,
                code: foundOffer.code,
                discount: foundOffer.offer_discount
            })

            // Pass the offer details to parent component
            onApplyOffer({
                offerId: foundOffer._id,
                code: foundOffer.code,
                discount: foundOffer.offer_discount
            })

            toast.success(`Offer "${foundOffer.code}" applied: ${foundOffer.offer_discount}% off`, {
                position: 'top-right',
                autoClose: 3000
            })

            // Close the form
            setOpenForm(false)
        } catch (error) {
            console.error('Error applying offer:', error)
            toast.error('Failed to apply offer. Please try again.', {
                position: 'top-right',
                autoClose: 3000
            })
        } finally {
            setIsValidating(false)
        }
    }

    const handleRemoveOffer = () => {
        setAppliedOffer(null)
        setOfferCode('')
        onApplyOffer(null)
        toast.info('Offer removed', {
            position: 'top-right',
            autoClose: 3000
        })
    }

    return (
        <div className='offer__code-area mb-3'>
            <div className='offer__code-wrap'>
                {appliedOffer ? (
                    <div className='applied-offer p-3' style={{ backgroundColor: '#121212', borderRadius: '10px' }}>
                        <div className='d-flex align-items-center justify-content-between'>
                            <div>
                                <span className='text-white'>
                                    <i className='fas fa-percentage me-2'></i> Applied Offer:{' '}
                                    <span style={{ color: '#3cf281' }}>{appliedOffer.code}</span> (
                                    {appliedOffer.discount}% off)
                                </span>
                            </div>
                            <button
                                className='btn btn-sm'
                                onClick={handleRemoveOffer}
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
                            <i className='fas fa-percentage me-2'></i>
                            <span className='text-white'>Have an offer code?</span>
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
                            <div className='offer__code mb-3'>
                                <form onSubmit={handleApplyOffer} className='d-flex'>
                                    <input
                                        type='text'
                                        placeholder='Offer code'
                                        value={offerCode}
                                        onChange={(e) => setOfferCode(e.target.value)}
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
                                        {isValidating ? 'Applying...' : 'Apply Offer'}
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
