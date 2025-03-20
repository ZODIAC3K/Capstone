'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../components/header'

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        if (!isLoggedIn) {
            router.push('/login')
        }
    }, [router])

    return (
        <div className='min-h-screen bg-gray-100'>
            <Header />
            <main className='container mx-auto px-4 py-8'>
                <h1 className='text-3xl font-bold mb-6'>Dashboard</h1>
                <div className='bg-white rounded-lg shadow-md p-6'>
                    <h2 className='text-xl font-semibold mb-4'>Welcome to your dashboard!</h2>
                    <p className='mb-4'>Here you can manage your orders, saved designs, and account settings.</p>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div className='bg-gray-100 p-4 rounded-lg'>
                            <h3 className='font-semibold mb-2'>Recent Orders</h3>
                            <p>You have no recent orders.</p>
                        </div>
                        <div className='bg-gray-100 p-4 rounded-lg'>
                            <h3 className='font-semibold mb-2'>Saved Designs</h3>
                            <p>You have no saved designs.</p>
                        </div>
                        <div className='bg-gray-100 p-4 rounded-lg'>
                            <h3 className='font-semibold mb-2'>Account Settings</h3>
                            <p>Update your profile and preferences.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
