'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
        name: string
        _id: string
    }
    category_id: {
        _id: string
        category_name: string
    }[]
    shader_id?: {
        _id: string
        shaderType: string
        shaderImage: {
            _id: string
            image_url: string
        }
    }
    rating?: number
    sales_count?: number
}

const ShopDetailsArea = ({ product }: { product: Product }) => {
    const [quantity, setQuantity] = useState<number>(1)
    const [activeTab, setActiveTab] = useState<string>('description')
    const [selectedImage, setSelectedImage] = useState<string>(product.image_id.image_url)
    const [isZoomed, setIsZoomed] = useState<boolean>(false)

    // Handle increment/decrement
    const handleQuantityChange = (action: string) => {
        if (action === 'inc') {
            setQuantity((prev) => prev + 1)
        } else if (action === 'dec' && quantity > 1) {
            setQuantity((prev) => prev - 1)
        }
    }

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
    }

    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl)
    }

    const toggleZoom = () => {
        setIsZoomed(!isZoomed)
    }

    return (
        <section className='product-details-section py-5' style={{ background: '#121212' }}>
            <div className='container'>
                <div className='bg-black text-white p-4 mb-4 rounded-3' style={{ borderLeft: '4px solid #22c55e' }}>
                    <h1 className='product-title fs-2 mb-0'>{product.title}</h1>
                </div>

                <div className='row g-4'>
                    {/* Left Column - Images */}
                    <div className='col-lg-6'>
                        <div className='product-images-container'>
                            <div
                                className='main-image-container position-relative bg-black rounded-4 overflow-hidden mb-3'
                                style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                                onClick={toggleZoom}
                            >
                                <Image
                                    src={selectedImage}
                                    alt={product.title}
                                    width={800}
                                    height={800}
                                    priority
                                    className={`main-product-image ${isZoomed ? 'zoomed' : ''}`}
                                    style={{
                                        width: '100%',
                                        height: isZoomed ? '600px' : '400px',
                                        objectFit: isZoomed ? 'contain' : 'cover',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                                <div className='image-overlay position-absolute bottom-0 start-0 p-3 text-white bg-black bg-opacity-75 w-100'>
                                    <small>Click to {isZoomed ? 'shrink' : 'zoom'}</small>
                                </div>
                            </div>

                            <div className='thumbnails-container d-flex gap-2 justify-content-start'>
                                <div
                                    className={`thumbnail-item rounded-3 overflow-hidden ${
                                        selectedImage === product.image_id.image_url ? 'border border-success' : ''
                                    }`}
                                    onClick={() => handleImageClick(product.image_id.image_url)}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        cursor: 'pointer',
                                        background: '#1E1E1E'
                                    }}
                                >
                                    <Image
                                        src={product.image_id.image_url}
                                        alt='Product thumbnail'
                                        width={80}
                                        height={80}
                                        className='w-100 h-100'
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>

                                {product.shader_id && (
                                    <div
                                        className={`thumbnail-item rounded-3 overflow-hidden ${
                                            selectedImage === product.shader_id.shaderImage.image_url
                                                ? 'border border-success'
                                                : ''
                                        }`}
                                        onClick={() => handleImageClick(product.shader_id!.shaderImage.image_url)}
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            cursor: 'pointer',
                                            background: '#1E1E1E'
                                        }}
                                    >
                                        <Image
                                            src={product.shader_id.shaderImage.image_url}
                                            alt='Shader thumbnail'
                                            width={80}
                                            height={80}
                                            className='w-100 h-100'
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className='col-lg-6'>
                        <div
                            className='product-details-info p-4 rounded-4 h-100'
                            style={{ background: '#1E1E1E', color: '#f5f5f5' }}
                        >
                            <div className='d-flex justify-content-between align-items-center mb-3'>
                                <div className='product-rating'>
                                    {[...Array(5)].map((_, i) => (
                                        <i
                                            key={i}
                                            className='fas fa-star'
                                            style={{
                                                color: i < Math.round(product.rating || 0) ? '#22c55e' : '#444444',
                                                fontSize: '18px',
                                                marginRight: '2px'
                                            }}
                                        ></i>
                                    ))}
                                    <span style={{ color: '#888888', fontSize: '14px', marginLeft: '6px' }}>
                                        ({product.rating ? product.rating.toFixed(1) : '0'})
                                    </span>
                                </div>
                            </div>

                            <div className='price-container mb-4'>
                                <h2 className='product-price fw-bold' style={{ color: '#22c55e' }}>
                                    {product.price.currency} {product.price.amount.toFixed(2)}
                                </h2>
                            </div>

                            <div className='product-meta mb-4'>
                                <div className='d-flex flex-column gap-2'>
                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px' }}>Creator:</span>
                                        <Link
                                            href={`/shop?creator=${product.creator_id._id}`}
                                            className='text-decoration-none'
                                            style={{ color: '#22c55e', fontWeight: 500 }}
                                        >
                                            {product.creator_id.name}
                                        </Link>
                                    </div>

                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px' }}>Sales:</span>
                                        <span style={{ color: '#f5f5f5' }}>{product.sales_count || 0}</span>
                                    </div>

                                    {product.shader_id && (
                                        <div className='meta-item d-flex'>
                                            <span style={{ color: '#888888', width: '80px' }}>Shader:</span>
                                            <span style={{ color: '#f5f5f5' }}>{product.shader_id.shaderType}</span>
                                        </div>
                                    )}

                                    <div className='meta-item d-flex'>
                                        <span style={{ color: '#888888', width: '80px', marginTop: '4px' }}>
                                            Categories:
                                        </span>
                                        <div
                                            className='d-flex gap-2 flex-wrap'
                                            style={{ flex: 1, marginTop: '2px', marginLeft: '30px' }}
                                        >
                                            {product.category_id.map((category) => (
                                                <Link
                                                    key={category._id}
                                                    href={`/shop?category=${category._id}`}
                                                    className='badge text-decoration-none py-2 px-3 mb-1'
                                                    style={{ background: '#333333', color: '#f5f5f5' }}
                                                >
                                                    {category.category_name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='quantity-container d-flex align-items-center mb-4'>
                                <div
                                    className='quantity-selector d-flex align-items-center rounded-pill overflow-hidden me-3 border'
                                    style={{ background: '#333333', borderColor: '#444444' }}
                                >
                                    <button
                                        className='btn btn-sm px-3 py-2 border-0 text-white'
                                        onClick={() => handleQuantityChange('dec')}
                                        disabled={quantity <= 1}
                                        style={{ background: '#333333' }}
                                    >
                                        <i className='fas fa-minus'></i>
                                    </button>
                                    <span className='px-3'>{quantity}</span>
                                    <button
                                        className='btn btn-sm px-3 py-2 border-0 text-white'
                                        onClick={() => handleQuantityChange('inc')}
                                        style={{ background: '#333333' }}
                                    >
                                        <i className='fas fa-plus'></i>
                                    </button>
                                </div>

                                <button
                                    className='btn btn-lg flex-grow-1 rounded-pill d-flex align-items-center justify-content-center'
                                    style={{ background: '#22c55e', color: 'white' }}
                                >
                                    <i className='fas fa-shopping-cart me-2'></i>
                                    <span>Add to Cart</span>
                                </button>
                            </div>

                            <div className='share-buttons mt-4 pt-4' style={{ borderTop: '1px solid #333333' }}>
                                <h5 className='fw-bold mb-3' style={{ color: '#f5f5f5' }}>
                                    Share
                                </h5>
                                <div className='d-flex gap-2'>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-facebook-f'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-twitter'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fab fa-instagram'></i>
                                    </Link>
                                    <Link
                                        href='#'
                                        className='btn btn-sm rounded-circle'
                                        style={{ background: '#333333', color: '#f5f5f5' }}
                                    >
                                        <i className='fas fa-link'></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row mt-5'>
                    <div className='col-12'>
                        <div
                            className='additional-details p-4 rounded-4'
                            style={{ background: '#1E1E1E', color: '#f5f5f5' }}
                        >
                            <ul
                                className='nav nav-tabs border-0 mb-4'
                                role='tablist'
                                style={{ borderBottom: '1px solid #333333' }}
                            >
                                <li className='nav-item' role='presentation'>
                                    <button
                                        className={`nav-link ${activeTab === 'description' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('description')}
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTab === 'description'}
                                        style={{
                                            background: activeTab === 'description' ? '#22c55e' : '#1E1E1E',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '4px 4px 0 0',
                                            marginRight: '5px'
                                        }}
                                    >
                                        Description
                                    </button>
                                </li>
                                <li className='nav-item' role='presentation'>
                                    <button
                                        className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('info')}
                                        type='button'
                                        role='tab'
                                        aria-selected={activeTab === 'info'}
                                        style={{
                                            background: activeTab === 'info' ? '#22c55e' : '#1E1E1E',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '4px 4px 0 0'
                                        }}
                                    >
                                        Additional Info
                                    </button>
                                </li>
                            </ul>

                            <div className='tab-content'>
                                <div
                                    className={`tab-pane fade ${activeTab === 'description' ? 'show active' : ''}`}
                                    role='tabpanel'
                                    style={{ padding: '20px 10px', color: '#f0f0f0' }}
                                >
                                    <p>{product.description}</p>
                                </div>
                                <div
                                    className={`tab-pane fade ${activeTab === 'info' ? 'show active' : ''}`}
                                    role='tabpanel'
                                    style={{ padding: '20px 10px' }}
                                >
                                    <div className='table-responsive'>
                                        <table
                                            className='table'
                                            style={{
                                                backgroundColor: '#ffffff',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                            }}
                                        >
                                            <tbody>
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            width: '200px',
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Product ID
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product._id}
                                                    </td>
                                                </tr>
                                                {product.shader_id && (
                                                    <tr>
                                                        <th
                                                            scope='row'
                                                            style={{
                                                                color: '#666666',
                                                                padding: '16px',
                                                                fontWeight: '500',
                                                                borderColor: '#f0f0f0'
                                                            }}
                                                        >
                                                            Shader Type
                                                        </th>
                                                        <td
                                                            style={{
                                                                color: '#333333',
                                                                padding: '16px',
                                                                borderColor: '#f0f0f0'
                                                            }}
                                                        >
                                                            {product.shader_id.shaderType}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Creator
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product.creator_id.name}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th
                                                        scope='row'
                                                        style={{
                                                            color: '#666666',
                                                            padding: '16px',
                                                            fontWeight: '500',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        Sales
                                                    </th>
                                                    <td
                                                        style={{
                                                            color: '#333333',
                                                            padding: '16px',
                                                            borderColor: '#f0f0f0'
                                                        }}
                                                    >
                                                        {product.sales_count || 0}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .main-product-image.zoomed {
                    transform: scale(1.05);
                    transition: transform 0.3s ease;
                }

                .thumbnail-item {
                    transition: all 0.2s ease;
                }

                .thumbnail-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }

                .nav-link {
                    transition: all 0.2s ease;
                }

                .nav-link:hover:not(.active) {
                    background: #333333;
                }
            `}</style>
        </section>
    )
}

export default ShopDetailsArea
