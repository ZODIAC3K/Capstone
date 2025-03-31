'use client'
import React, { useState, useEffect } from 'react'
import ShopSidebar from './shop-sidebar'
import ShopItem from './shop-item'
import Pagination from '../ui/pagination'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './shop-area.module.css'

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

interface ProductsResponse {
    success: boolean
    data: Product[]
    pagination: {
        totalProducts: number
        totalPages: number
        currentPage: number
        limit: number
    }
}

const ShopArea = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')

    // Get category filter from URL if present
    const categoryId = searchParams.get('category')
    const creatorId = searchParams.get('creator')
    const searchTerm = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)

                // Build query parameters
                const params = new URLSearchParams()
                params.append('page', currentPage.toString())
                params.append('limit', '6') // Match the original pagination limit
                params.append('sortBy', sortBy)
                params.append('sortOrder', sortOrder)

                if (categoryId) params.append('category', categoryId)
                if (creatorId) params.append('creator', creatorId)
                if (searchTerm) params.append('title', searchTerm)

                // Handle price range parameters correctly
                if (minPrice) {
                    const minPriceValue = parseInt(minPrice, 10)
                    if (!isNaN(minPriceValue) && minPriceValue >= 0) {
                        params.append('minPrice', minPriceValue.toString())
                    }
                }

                if (maxPrice) {
                    const maxPriceValue = parseInt(maxPrice, 10)
                    if (!isNaN(maxPriceValue) && maxPriceValue > 0) {
                        params.append('maxPrice', maxPriceValue.toString())
                    }
                }

                console.log('Fetching products with params:', params.toString()) // Debug log
                const response = await fetch(`/api/product?${params.toString()}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch products')
                }

                const data: ProductsResponse = await response.json()
                console.log('API response:', data) // Debug log

                if (data.success) {
                    setProducts(data.data)
                    setTotalPages(data.pagination.totalPages)
                    setCurrentPage(data.pagination.currentPage)

                    // If no products found but price filters are applied, maybe reset?
                    if (data.data.length === 0 && (minPrice || maxPrice)) {
                        console.log('No products found within price range')
                    }
                } else {
                    throw new Error(data.data.toString())
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
                console.error('Error fetching products:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [currentPage, sortBy, sortOrder, categoryId, creatorId, searchTerm, minPrice, maxPrice])

    const handlePageClick = (event: { selected: number }) => {
        setCurrentPage(event.selected + 1)
        window.scrollTo(0, 0)
    }

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value

        switch (value) {
            case 'default':
                setSortBy('createdAt')
                setSortOrder('desc')
                break
            case 'popularity':
                setSortBy('sales_count')
                setSortOrder('desc')
                break
            case 'rating':
                setSortBy('rating')
                setSortOrder('desc')
                break
            case 'latest':
                setSortBy('createdAt')
                setSortOrder('desc')
                break
            case 'price-low':
                setSortBy('price.amount')
                setSortOrder('asc')
                break
            case 'price-high':
                setSortBy('price.amount')
                setSortOrder('desc')
                break
        }
    }

    const handleProductClick = (productId: string) => {
        router.push(`/product-details/${productId}`)
    }

    return (
        <section className='shop-area'>
            <div className='container'>
                <div className='row justify-content-center'>
                    <div className='col-xl-3 col-lg-4 col-md-11 order-2 order-lg-0'>
                        {/* sidebar start */}
                        <ShopSidebar initialProducts={products} />
                        {/* sidebar end */}
                    </div>
                    <div className='col-xl-9 col-lg-8 col-md-11'>
                        <div className='shop__top-wrap'>
                            <div className='row align-items-center'>
                                <div className='col-lg-8 col-sm-6'>
                                    <div className='shop__showing-result'>
                                        {!loading && (
                                            <p>
                                                Showing {products.length > 0 ? (currentPage - 1) * 6 + 1 : 0} -{' '}
                                                {Math.min(currentPage * 6, products.length)} of {products.length}{' '}
                                                results
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className='col-lg-4 col-sm-6'>
                                    <div className='shop__ordering'>
                                        <select
                                            name='orderby'
                                            className='orderby'
                                            onChange={handleSortChange}
                                            value={`${
                                                sortBy === 'createdAt' && sortOrder === 'desc'
                                                    ? 'default'
                                                    : sortBy === 'sales_count'
                                                      ? 'popularity'
                                                      : sortBy === 'rating'
                                                        ? 'rating'
                                                        : sortBy === 'createdAt' && sortOrder === 'desc'
                                                          ? 'latest'
                                                          : sortBy === 'price.amount' && sortOrder === 'asc'
                                                            ? 'price-low'
                                                            : 'price-high'
                                            }`}
                                        >
                                            <option value='default'>Default sorting</option>
                                            <option value='popularity'>Sort by popularity</option>
                                            <option value='rating'>Sort by average rating</option>
                                            <option value='latest'>Sort by latest</option>
                                            <option value='price-low'>Sort by price: low to high</option>
                                            <option value='price-high'>Sort by price: high to low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className='text-center py-5'>
                                <div className='spinner-border text-primary' role='status'>
                                    <span className='visually-hidden'>Loading...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className='alert alert-danger' role='alert'>
                                {error}
                            </div>
                        ) : products.length === 0 ? (
                            <div className='text-center py-5'>
                                <p>No products found.</p>
                            </div>
                        ) : (
                            <div className='row justify-content-center row-cols-xl-3 row-cols-lg-2 row-cols-md-2 row-cols-sm-2 row-cols-1'>
                                {products.map((product) => (
                                    <div key={product._id} className='col'>
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
                                            onClick={() => handleProductClick(product._id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && products.length > 0 && (
                            <div className='pagination__wrap react-pagination'>
                                <Pagination pageCount={totalPages} handlePageClick={handlePageClick} />
                            </div>
                        )}

                        <button type='submit' className={styles.addButton} disabled={loading}>
                            {loading ? 'Adding...' : 'Add New Product'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ShopArea
