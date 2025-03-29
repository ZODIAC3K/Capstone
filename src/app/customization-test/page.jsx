'use client'
import React, { useState } from 'react'
import ProductCustomizeButton from '../components/ProductCustomizeButton'

export default function CustomizationTest() {
    const [result, setResult] = useState(null)

    const handleCustomization = (data) => {
        console.log('Customization data:', data)
        setResult(data)
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900'>
            <h1 className='text-3xl font-bold mb-8 text-white'>Product Customization Preview</h1>

            <div className='bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-4xl mx-auto border border-gray-800'>
                <p className='text-gray-400 mb-6'>
                    Click the button below to open the customization interface and design your product.
                </p>

                <div className='flex justify-center mb-6'>
                    <ProductCustomizeButton productId='test-product' onCustomizationComplete={handleCustomization} />
                </div>

                {result && (
                    <div className='mt-6 border-t border-gray-700 pt-6'>
                        <div className='grid grid-cols-2 gap-4 mb-6'>
                            {/* Top row: Color and Type */}
                            <div className='bg-gray-700 p-3 rounded-lg'>
                                <h4 className='text-xs font-medium text-gray-400 mb-2'>Color</h4>
                                <div
                                    className='w-full rounded-md border border-gray-600 shadow-sm p-4'
                                    style={{ backgroundColor: result.color }}
                                ></div>
                                <span className='text-xs text-gray-400 block mt-1 truncate'>{result.color}</span>
                            </div>

                            <div className='bg-gray-700 p-3 rounded-lg'>
                                <h4 className='text-xs font-medium text-gray-400 mb-2'>Product Type</h4>
                                <div className='p-4 flex items-center'>
                                    <p className='text-sm font-medium text-gray-200 capitalize'>{result.modelType}</p>
                                </div>
                            </div>
                        </div>

                        <div className='flex justify-center'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl'>
                                {/* Image cards */}
                                <div className='bg-gray-700 p-3 rounded-lg shadow-sm'>
                                    <h4 className='text-xs font-medium text-gray-400 mb-2'>Shader</h4>
                                    <div className='h-48 w-60 mx-auto bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center'>
                                        {result.shaderImage ? (
                                            <img
                                                src={result.shaderImage}
                                                alt='Shader'
                                                className='max-w-[90%] max-h-[90%] object-contain'
                                            />
                                        ) : (
                                            <span className='text-xs text-gray-600'>No shader image available</span>
                                        )}
                                    </div>
                                </div>

                                <div className='bg-gray-700 p-3 rounded-lg shadow-sm'>
                                    <h4 className='text-xs font-medium text-gray-400 mb-2'>Product</h4>
                                    <div className='h-48 w-60 mx-auto bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center'>
                                        {result.productImage ? (
                                            <img
                                                src={result.productImage}
                                                alt='Customized product'
                                                className='max-w-[90%] max-h-[90%] object-contain'
                                            />
                                        ) : (
                                            <span className='text-xs text-gray-600'>No product image available</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div className='mt-6'>
                            <button
                                onClick={() => setResult(null)}
                                className='px-4 py-2 text-sm font-medium rounded-md focus:ring-2 focus:ring-offset-1 focus:ring-green-500 focus:outline-none transition-all w-full hover:shadow-md'
                                style={{ backgroundColor: '#16a34a', color: '#ffffff', borderColor: '#15803d' }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add necessary styles for Three.js */}
            <style jsx global>{`
                /* Reset for Three.js canvas */
                body {
                    overflow-x: hidden;
                    background-color: #111827;
                    color: #f3f4f6;
                }

                /* Ensure modal has highest z-index */
                .fixed.z-50 {
                    z-index: 9999 !important;
                }

                /* Ensure canvas has proper dimensions */
                canvas {
                    display: block;
                }

                /* Improved image rendering */
                img {
                    image-rendering: high-quality;
                }

                /* Force Customize Product button styling */
                button:contains('Customize Product'),
                button[class*='rounded-lg'] {
                    background: #16a34a !important;
                    background-image: none !important;
                    color: white !important;
                }

                button:contains('Customize Product'):hover,
                button[class*='rounded-lg']:hover {
                    background: #15803d !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2) !important;
                }

                /* Force reset button styling */
                button:contains('Reset') {
                    background: #16a34a !important;
                    background-image: none !important;
                    color: white !important;
                    border-color: #15803d !important;
                    font-weight: 500 !important;
                }

                button:contains('Reset'):hover {
                    background: #15803d !important;
                    box-shadow:
                        0 4px 6px -1px rgba(0, 0, 0, 0.1),
                        0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                }

                /* Gradient animations */
                @keyframes gradientAnimation {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }

                .bg-gradient-to-br {
                    background-size: 200% 200%;
                    animation: gradientAnimation 15s ease infinite;
                }

                /* Grid ensures side-by-side display on larger screens */
                @media (min-width: 640px) {
                    .grid-cols-1.sm\\:grid-cols-2 {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                    }
                }

                /* Simple image centering - avoids absolute positioning issues */
                .h-48 {
                    height: 12rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .h-48 img {
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                }
            `}</style>
        </div>
    )
}
