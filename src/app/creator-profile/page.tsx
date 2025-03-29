'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import Wrapper from '@/layout/wrapper'
import Header from '@/layout/header/header'
import Footer from '@/layout/footer/footer'
import BreadcrumbArea from '../components/breadcrumb/breadcrumb-area'
import brd_bg from '@/assets/img/bg/breadcrumb_bg01.jpg'
import brd_img from '@/assets/img/team/breadcrumb_team.png'
import TeamDetailsArea from '../components/team/team-details-area'
import TeamArea from '../components/team/team-area'
import BrandArea from '../components/brand/brand-area'
import { mockCreatorData } from './mock-data'

// We can't use export const metadata with client components
// So we'll need to handle metadata differently

// Remove the Button import and create a simple button component inline
const Button = ({
    children,
    className = '',
    href,
    ...props
}: {
    children: React.ReactNode
    className?: string
    href?: string
    [key: string]: any
}) => {
    const baseClasses = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
    const buttonClasses = `${baseClasses} ${className}`

    if (href) {
        return (
            <Link href={href} className={buttonClasses} {...props}>
                {children}
            </Link>
        )
    }

    return (
        <button className={buttonClasses} {...props}>
            {children}
        </button>
    )
}

export default function CreatorProfilePage() {
    const [creator, setCreator] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [useMockData, setUseMockData] = useState(false)

    useEffect(() => {
        const fetchCreatorProfile = async () => {
            try {
                setLoading(true)
                console.log('Fetching creator profile...')
                // Try with explicit method and full URL
                const response = await fetch('/api/creator', {
                    method: 'GET',
                    credentials: 'include'
                })

                console.log('Response status:', response.status)
                console.log('Response ok:', response.ok)

                if (!response.ok) {
                    console.error('API error:', response.status)
                    setError('Error: ' + response.status)
                    return
                }

                const result = await response.json()
                console.log('Response received:', result)

                if (!result.success) {
                    setError(result.error || 'Failed to fetch creator profile')
                    return
                }

                setCreator(result.data)
            } catch (err) {
                console.error('Error fetching creator profile:', err)
                setError('An error occurred while fetching the creator profile')
            } finally {
                setLoading(false)
            }
        }

        fetchCreatorProfile()
    }, [])

    // Mock data fallback button handler
    const handleUseMockData = () => {
        console.log('Using mock data as fallback')
        setCreator(mockCreatorData)
        setError(null)
        setUseMockData(true)
    }

    const getImageUrl = (imageData: any) => {
        if (!imageData) return '/placeholder.png'

        try {
            // If imageData is already populated with buffer data
            if (imageData.data && imageData.content_type) {
                // Convert buffer data to base64
                const base64 =
                    typeof imageData.data === 'string' ? imageData.data : Buffer.from(imageData.data).toString('base64')
                return `data:${imageData.content_type};base64,${base64}`
            }
            // If imageData is just an ID, we'll use a placeholder
            return '/placeholder.png'
        } catch (err) {
            console.error('Error processing image:', err)
            return '/placeholder.png'
        }
    }

    if (loading) {
        return (
            <Wrapper>
                <div className='flex justify-center items-center min-h-screen'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900'></div>
                </div>
            </Wrapper>
        )
    }

    if (error) {
        return (
            <Wrapper>
                <div className='min-h-screen flex flex-col items-center justify-center p-4'>
                    <h1 className='text-2xl font-bold text-red-600 mb-4'>Error Loading Creator Profile</h1>
                    <p className='text-gray-700 mb-6'>{error}</p>
                    <div className='flex space-x-4'>
                        <Button href='/'>Go Back Home</Button>
                        <button
                            onClick={handleUseMockData}
                            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
                        >
                            Use Demo Data
                        </button>
                    </div>
                </div>
            </Wrapper>
        )
    }

    if (!creator) {
        return (
            <Wrapper>
                <div className='min-h-screen flex flex-col items-center justify-center p-4'>
                    <h1 className='text-2xl font-bold mb-4'>No Creator Profile Found</h1>
                    <p className='text-gray-700 mb-6'>Would you like to create a creator profile?</p>
                    <Button href='/creator-signup'>Create Creator Profile</Button>
                </div>
            </Wrapper>
        )
    }

    // Get profile and cover image URLs
    const profileImageUrl = creator.creatorProfilePicture
        ? getImageUrl(creator.creatorProfilePicture)
        : '/placeholder.png'

    const coverImageUrl = creator.creatorCoverImage ? getImageUrl(creator.creatorCoverImage) : '/placeholder-cover.png'

    return (
        <Wrapper>
            {/* header start */}
            <Header />
            {/* header end */}

            {/* main area start */}
            <main className='main--area'>
                {/* breadcrumb area start */}
                <BreadcrumbArea
                    title={creator.name || 'Creator Profile'}
                    subtitle='CREATOR PROFILE'
                    bg={brd_bg}
                    brd_img={brd_img}
                />
                {/* breadcrumb area end */}

                {/* team details area start */}
                <TeamDetailsArea />
                {/* team details area end */}

                {/* team area start */}
                <TeamArea />
                {/* team area end */}

                {/*  */}
                <BrandArea />

                {/* Cover Image Section */}
                <div className='relative h-64 w-full rounded-lg overflow-hidden mb-20'>
                    <Image src={coverImageUrl} alt='Cover Image' fill className='object-cover' priority />

                    {/* Profile Image (positioned overlapping the cover) */}
                    <div className='absolute -bottom-16 left-8'>
                        <div className='h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg'>
                            <Image
                                src={profileImageUrl}
                                alt={creator.name || 'Creator'}
                                width={128}
                                height={128}
                                className='object-cover'
                            />
                        </div>
                    </div>
                </div>

                {/* Creator Information */}
                <div className='mt-20 px-4'>
                    <h1 className='text-3xl font-bold'>{creator.name}</h1>

                    {creator.quote && <p className='text-gray-600 italic mt-2'>"{creator.quote}"</p>}

                    {creator.bio && (
                        <div className='mt-4 max-w-3xl'>
                            <h2 className='text-xl font-semibold mb-2'>About</h2>
                            <p className='text-gray-700'>{creator.bio}</p>
                        </div>
                    )}

                    {/* Creator Stats */}
                    <div className='mt-6 flex gap-8'>
                        <div>
                            <h3 className='text-sm text-gray-500'>Products</h3>
                            <p className='text-xl font-semibold'>{creator.products?.length || 0}</p>
                        </div>
                        <div>
                            <h3 className='text-sm text-gray-500'>Total Sales</h3>
                            <p className='text-xl font-semibold'>₹{creator.totalSales || 0}</p>
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    <div className='mt-6'>
                        <Button href='/creator-profile/edit'>Edit Profile</Button>
                    </div>

                    {/* Products Section */}
                    {creator.products && creator.products.length > 0 ? (
                        <div className='mt-12'>
                            <h2 className='text-2xl font-bold mb-6'>My Products</h2>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                {creator.products.map((product: any) => {
                                    const productImageUrl = product.image_id
                                        ? getImageUrl(product.image_id)
                                        : '/placeholder-product.png'

                                    return (
                                        <div
                                            key={product._id}
                                            className='border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow'
                                        >
                                            <div className='h-48 relative'>
                                                <Image
                                                    src={productImageUrl}
                                                    alt={product.title}
                                                    fill
                                                    className='object-cover'
                                                />
                                            </div>
                                            <div className='p-4'>
                                                <h3 className='font-semibold text-lg'>{product.title}</h3>
                                                <p className='text-gray-600 line-clamp-2 mt-1'>{product.description}</p>
                                                <div className='mt-2 flex justify-between items-center'>
                                                    <span className='font-bold'>₹{product.price?.amount || 0}</span>
                                                    <span className='text-sm text-gray-500'>
                                                        {product.sales_count || 0} sales
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='p-4 pt-0 flex justify-end'>
                                                <Button href={`/product/${product._id}`}>View Details</Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className='mt-12 text-center p-8 bg-gray-50 rounded-lg'>
                            <h2 className='text-xl font-semibold mb-3'>No Products Yet</h2>
                            <p className='text-gray-600 mb-4'>Start creating and selling your digital assets today!</p>
                            <Button href='/product/create'>Create Your First Product</Button>
                        </div>
                    )}
                </div>
            </main>
            {/* main area end */}

            {/* footer start */}
            <Footer />
            {/* footer end */}
        </Wrapper>
    )
}
