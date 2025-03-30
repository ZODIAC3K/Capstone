'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import InputRange from '../ui/input-range'

interface Category {
    _id: string
    category_name: string
    count?: number
}

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

interface ShopSidebarProps {
    initialProducts?: Product[]
}

// Helper function to get currency symbol
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

const ShopSidebar: React.FC<ShopSidebarProps> = ({ initialProducts = [] }) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [priceValue, setPriceValue] = useState([0, 1000])
    const [minPrice, setMinPrice] = useState(0)
    const [maxPrice, setMaxPrice] = useState(1000)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [relatedLoading, setRelatedLoading] = useState(initialProducts.length === 0)
    const [currency, setCurrency] = useState(
        initialProducts.length > 0 ? getCurrencySymbol(initialProducts[0]?.price?.currency || 'INR') : '₹'
    )

    // Get existing search parameters
    const categoryId = searchParams.get('category')
    const creatorId = searchParams.get('creator')
    const existingSearch = searchParams.get('search')

    useEffect(() => {
        // Use initial products data if available
        if (initialProducts && initialProducts.length > 0) {
            // Set related products from props
            setRelatedProducts(initialProducts.slice(0, 2))
            setRelatedLoading(false)

            // Set currency from the first product
            if (initialProducts[0]?.price?.currency) {
                setCurrency(getCurrencySymbol(initialProducts[0].price.currency))
            }

            // Calculate min and max price from provided products
            if (initialProducts.length > 0) {
                const prices = initialProducts.map((product) => product.price.amount)
                const min = Math.floor(Math.min(...prices))
                const max = Math.ceil(Math.max(...prices))

                setMinPrice(min)
                setMaxPrice(max)
                setPriceValue([min, max])
            }
        }

        // Fetch categories
        const fetchCategories = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/category')

                if (!response.ok) {
                    throw new Error('Failed to fetch categories')
                }

                const data = await response.json()

                if (data.success) {
                    setCategories(data.data)
                } else {
                    // Handle API error response
                    console.error('API returned error:', data.error)
                    setCategories([])
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
                setCategories([]) // Set empty array on error
            } finally {
                setLoading(false)
            }
        }

        // Only fetch price range if no initialProducts
        const fetchPriceRange = async () => {
            if (initialProducts && initialProducts.length > 0) return

            try {
                const response = await fetch('/api/product/price-range')

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.data) {
                        setMinPrice(data.data.minPrice || 0)
                        setMaxPrice(data.data.maxPrice || 1000)
                        setPriceValue([data.data.minPrice || 0, data.data.maxPrice || 1000])
                        // Set currency from API response if available
                        if (data.data.currency) {
                            setCurrency(getCurrencySymbol(data.data.currency))
                        }
                    } else {
                        // Handle API error response
                        console.error('API returned error:', data.error)
                        // Keep default values
                        setPriceValue([0, 1000])
                    }
                } else {
                    // Handle non-OK response
                    console.error('Failed to fetch price range, status:', response.status)
                    // Keep default values
                    setPriceValue([0, 1000])
                }
            } catch (error) {
                console.error('Error fetching price range:', error)
                // Keep default values on error
                setPriceValue([0, 1000])
            }
        }

        // Only fetch related products if no initialProducts
        const fetchRelatedProducts = async () => {
            if (initialProducts && initialProducts.length > 0) return

            try {
                setRelatedLoading(true)
                const response = await fetch('/api/product/new')

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.data) {
                        // Use the first 2 products
                        setRelatedProducts(data.data.slice(0, 2))
                    } else {
                        setRelatedProducts([])
                    }
                } else {
                    setRelatedProducts([])
                }
            } catch (error) {
                console.error('Error fetching related products:', error)
                setRelatedProducts([])
            } finally {
                setRelatedLoading(false)
            }
        }

        fetchCategories()
        fetchPriceRange()
        fetchRelatedProducts()

        // Initialize search term from URL if present
        if (existingSearch) {
            setSearchTerm(existingSearch)
        }
    }, [existingSearch, initialProducts])

    // Handle price filter changes
    const handleChanges = (val: number[]) => {
        setPriceValue(val)
    }

    // Apply price filter
    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Make sure we're not setting invalid price ranges
        if (priceValue[0] >= 0 && priceValue[1] > 0 && priceValue[0] <= priceValue[1]) {
            // Add price range parameters
            params.set('minPrice', priceValue[0].toString())
            params.set('maxPrice', priceValue[1].toString())
        } else {
            // If invalid range, remove price filters
            params.delete('minPrice')
            params.delete('maxPrice')
        }

        // Keep other existing parameters
        router.push(`/shop?${params.toString()}`)
    }

    // Add reset price filter function
    const resetPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('minPrice')
        params.delete('maxPrice')
        router.push(`/shop?${params.toString()}`)
    }

    // Add an effect to sync URL params with state
    useEffect(() => {
        // Get price range from URL if present
        const urlMinPrice = searchParams.get('minPrice')
        const urlMaxPrice = searchParams.get('maxPrice')

        if (urlMinPrice && urlMaxPrice) {
            const min = parseInt(urlMinPrice, 10)
            const max = parseInt(urlMaxPrice, 10)

            // Only update if values are valid and different from current state
            if (!isNaN(min) && !isNaN(max) && min <= max && (min !== priceValue[0] || max !== priceValue[1])) {
                setPriceValue([min, max])
            }
        }
    }, [searchParams])

    // Handle search form submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()

        const params = new URLSearchParams(searchParams.toString())

        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim())
        } else {
            params.delete('search')
        }

        router.push(`/shop?${params.toString()}`)
    }

    return (
        <aside className='shop-sidebar'>
            <div className='shop__widget rounded-4 overflow-hidden' style={{ background: '#121212' }}>
                <h4
                    className='shop__widget-title p-4 m-0 d-flex align-items-center'
                    style={{ background: '#151515', borderLeft: '4px solid #22c55e' }}
                >
                    <i className='fas fa-search me-2' style={{ color: '#22c55e' }}></i>
                    SEARCH
                </h4>
                <div className='shop__widget-inner p-4'>
                    <div className='shop__search'>
                        <form onSubmit={handleSearch}>
                            <div className='position-relative'>
                                <input
                                    type='text'
                                    placeholder='Search products'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className='form-control bg-dark border-0 text-white py-3'
                                    style={{
                                        background: '#151515',
                                        paddingRight: '40px',
                                        paddingLeft: '16px'
                                    }}
                                />
                                <button
                                    className='position-absolute end-0 top-50 translate-middle-y bg-transparent border-0 text-white pe-3'
                                    type='submit'
                                >
                                    <i className='fas fa-search'></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className='shop__widget mt-4 rounded-4 overflow-hidden' style={{ background: '#121212' }}>
                <h4
                    className='shop__widget-title p-4 m-0 d-flex align-items-center'
                    style={{ background: '#151515', borderLeft: '4px solid #22c55e' }}
                >
                    <i className='fas fa-filter me-2' style={{ color: '#22c55e' }}></i>
                    FILTER BY PRICE
                </h4>
                <div className='shop__widget-inner p-4'>
                    <div className='shop__price-filter'>
                        <div id='slider-range' className='mb-4'>
                            <InputRange
                                MAX={maxPrice || 1000}
                                MIN={minPrice || 0}
                                STEP={Math.max(1, Math.floor((maxPrice - minPrice) / 100))}
                                values={priceValue}
                                handleChanges={handleChanges}
                            />
                        </div>
                        <div className='d-flex flex-column mt-4'>
                            <div className='mt-2 mb-3 text-white text-center'>
                                {currency}
                                {priceValue[0]} - {currency}
                                {priceValue[1]}
                            </div>
                            <div className='d-flex justify-content-center gap-2'>
                                <button
                                    onClick={applyPriceFilter}
                                    className='btn py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center'
                                    style={{
                                        background: '#22c55e',
                                        color: 'white',
                                        border: 'none',
                                        width:
                                            searchParams.has('minPrice') || searchParams.has('maxPrice')
                                                ? '50%'
                                                : '200px'
                                    }}
                                >
                                    APPLY
                                </button>
                                {(searchParams.has('minPrice') || searchParams.has('maxPrice')) && (
                                    <button
                                        onClick={resetPriceFilter}
                                        className='btn py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center'
                                        style={{
                                            background: '#333',
                                            color: 'white',
                                            border: 'none',
                                            width: '50%'
                                        }}
                                    >
                                        RESET
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='shop__widget mt-4 rounded-4 overflow-hidden' style={{ background: '#121212' }}>
                <h4
                    className='shop__widget-title p-4 m-0 d-flex align-items-center'
                    style={{ background: '#151515', borderLeft: '4px solid #22c55e' }}
                >
                    <i className='fas fa-tags me-2' style={{ color: '#22c55e' }}></i>
                    Categories
                </h4>
                <div className='shop__widget-inner p-4'>
                    {loading ? (
                        <div className='text-center py-3'>
                            <div className='spinner-border spinner-border-sm text-success' role='status'>
                                <span className='visually-hidden'>Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <ul className='product-categories list-wrap list-unstyled'>
                            <li className={!categoryId ? 'active mb-3' : 'mb-3'}>
                                <Link
                                    href='/shop'
                                    className={`text-decoration-none d-flex justify-content-between ${!categoryId ? 'text-success' : 'text-white'}`}
                                >
                                    All Categories
                                </Link>
                            </li>
                            {categories.map((category) => (
                                <li key={category._id} className={categoryId === category._id ? 'active mb-3' : 'mb-3'}>
                                    <Link
                                        href={`/shop?category=${category._id}`}
                                        className={`text-decoration-none d-flex justify-content-between ${categoryId === category._id ? 'text-success' : 'text-white'}`}
                                    >
                                        {category.category_name}
                                        {category.count !== undefined && (
                                            <span className='badge rounded-pill' style={{ background: '#333' }}>
                                                {category.count}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {creatorId && (
                <div className='shop__widget mt-4 rounded-4 overflow-hidden' style={{ background: '#121212' }}>
                    <div className='shop__widget-inner p-4'>
                        <div className='d-grid'>
                            <Link
                                href='/shop'
                                className='btn btn-outline-secondary border-2'
                                style={{ borderColor: '#22c55e', color: '#22c55e' }}
                            >
                                Clear All Filters
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className='shop__widget mt-4 rounded-4 overflow-hidden' style={{ background: '#121212' }}>
                <h4
                    className='shop__widget-title p-4 m-0 d-flex align-items-center'
                    style={{ background: '#151515', borderLeft: '4px solid #22c55e' }}
                >
                    <i className='fas fa-star me-2' style={{ color: '#22c55e' }}></i>
                    Related products
                </h4>
                <div className='shop__widget-inner p-4'>
                    {relatedLoading ? (
                        <div className='text-center py-3'>
                            <div className='spinner-border spinner-border-sm text-success' role='status'>
                                <span className='visually-hidden'>Loading...</span>
                            </div>
                        </div>
                    ) : relatedProducts.length > 0 ? (
                        relatedProducts.map((product) => (
                            <div key={product._id} className='related__products-item mb-3 d-flex align-items-center'>
                                <div className='related__products-thumb me-3'>
                                    <Link href={`/product-details/${product._id}`}>
                                        <Image
                                            src={product.image_id.image_url}
                                            alt={product.title}
                                            width={78}
                                            height={80}
                                            className='rounded-3'
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </Link>
                                </div>
                                <div className='related__products-content'>
                                    <h4 className='product-name mb-2'>
                                        <Link
                                            href={`/product-details/${product._id}`}
                                            className='text-white text-decoration-none'
                                            style={{ fontSize: '14px' }}
                                        >
                                            {product.title}
                                        </Link>
                                    </h4>
                                    <span className='amount fw-bold' style={{ color: '#22c55e' }}>
                                        {getCurrencySymbol(product.price.currency)} {product.price.amount}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className='text-center text-white'>No related products found</p>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default ShopSidebar
