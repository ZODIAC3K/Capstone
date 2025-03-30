'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
    const router = useRouter()
    const [orderId, setOrderId] = useState<string | null>(null)

    useEffect(() => {
        // Get the order ID from localStorage
        const id = localStorage.getItem('lastOrderId')
        setOrderId(id)
    }, [])

    return (
        <Wrapper>
            <Header />
            <main className='main--area'>
                <div className='section-pt-120 section-pb-120'>
                    <div className='container'>
                        <div className='row justify-content-center'>
                            <div className='col-lg-8'>
                                <div
                                    className='text-center'
                                    style={{
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '15px',
                                        padding: '40px 30px'
                                    }}
                                >
                                    <div className='success-icon mb-4'>
                                        <svg
                                            width='80'
                                            height='80'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'
                                        >
                                            <circle cx='12' cy='12' r='11' stroke='#4CAF50' strokeWidth='2' />
                                            <path
                                                d='M7 12L10 15L17 8'
                                                stroke='#4CAF50'
                                                strokeWidth='2'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            />
                                        </svg>
                                    </div>

                                    <h2 className='text-white mb-3'>Order Placed Successfully!</h2>

                                    {orderId && (
                                        <p className='text-white-50 mb-4'>
                                            Your order{' '}
                                            <span className='text-success fw-bold'>#{orderId.slice(-6)}</span> has been
                                            placed successfully. You'll receive a confirmation email shortly.
                                        </p>
                                    )}

                                    <div className='d-flex flex-column flex-md-row justify-content-center gap-3 mt-4'>
                                        <Link href='/shop' className='btn tg-btn-1 tg-svg'>
                                            Continue Shopping
                                            <svg
                                                xmlns='http://www.w3.org/2000/svg'
                                                width='16'
                                                height='16'
                                                fill='currentColor'
                                                viewBox='0 0 16 16'
                                            >
                                                <path d='M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z' />
                                            </svg>
                                        </Link>
                                        <Link href='/orders' className='btn tg-btn-2'>
                                            View My Orders
                                            <i className='fas fa-angle-right'></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </Wrapper>
    )
}
