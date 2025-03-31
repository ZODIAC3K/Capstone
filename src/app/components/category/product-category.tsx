'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Category {
    _id: string
    category_name: string
    image_url: string
    count: number
    is_active: boolean
}

export default function ProductCategory() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/category')
                if (!response.ok) {
                    throw new Error('Failed to fetch categories')
                }
                const data = await response.json()
                if (data.success) {
                    setCategories(data.data)
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    return (
        <section
            className='product-category__area section-pt-120 section-pb-120'
            data-background='/assets/img/bg/item-category-bg.png'
            style={{
                backgroundImage: `url(/assets/img/bg/item-category-bg.png)`
            }}
        >
            <div className='container custom-container4'>
                <div className='row gy-4'>
                    {loading ? (
                        <div className='col-12 text-center'>
                            <div className='spinner-border text-primary' role='status'>
                                <span className='visually-hidden'>Loading...</span>
                            </div>
                        </div>
                    ) : (
                        categories.map((category, index) => (
                            <div
                                key={category._id}
                                className={
                                    index === 0 || index === categories.length - 1 ? 'col-lg-6' : 'col-xl-3 col-lg-6'
                                }
                            >
                                <div className='shop__category'>
                                    <div className='shop__category-thumb'>
                                        <Image
                                            src={category.image_url}
                                            alt={category.category_name}
                                            width={250}
                                            height={250}
                                            style={{
                                                height:
                                                    index === 0 || index === categories.length - 1 ? '270px' : '250px',
                                                width:
                                                    index === 0 || index === categories.length - 1 ? '270px' : '250px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                    <div className='shop__category-content'>
                                        <h4 className='title'>
                                            <Link href={`/shop?category=${category._id}`}>
                                                {category.category_name}
                                            </Link>
                                        </h4>
                                        {category.count > 0 && (
                                            <span className='badge bg-primary ms-2'>{category.count} items</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    )
}
