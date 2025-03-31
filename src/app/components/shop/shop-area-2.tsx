'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CompareSvg } from '../svg'
import ShopItem from './shop-item'

interface Product {
    _id: string
    title: string
    description: string
    price: {
        amount: number
        currency: string
    }
    image_id: {
        _id: string
        image_url: string
    }
    creator_id: {
        _id: string
        name: string
    }
    category_id: {
        _id: string
        category_name: string
    }[]
    sales_count: number
    rating: number
}

export default function ShopAreaTwo() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNewProducts = async () => {
            try {
                const response = await fetch('/api/product?sortBy=createdAt&sortOrder=desc&limit=8')
                if (!response.ok) {
                    throw new Error('Failed to fetch new products')
                }
                const data = await response.json()
                if (data.success) {
                    setProducts(data.data)
                }
            } catch (error) {
                console.error('Error fetching new products:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNewProducts()
    }, [])

    return (
        <section className='shop-area'>
            <div className='container custom-container4'>
                <div className='section__title text-center mb-60 title-shape-none'>
                    <h3 className='title'>NEW COLLECTION</h3>
                </div>
                {loading ? (
                    <div className='text-center'>
                        <div className='spinner-border text-primary' role='status'>
                            <span className='visually-hidden'>Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className='row justify-content-center gy-4'>
                        {products.map((product) => (
                            <div key={product._id} className='col-xl-3 col-md-6'>
                                <ShopItem
                                    item={{
                                        id: product._id,
                                        img: product.image_id.image_url,
                                        title: product.title,
                                        price: Number(product.price.amount),
                                        currency: product.price.currency,
                                        creator: product.creator_id.name,
                                        category: product.category_id[0]?.category_name || 'Uncategorized'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
