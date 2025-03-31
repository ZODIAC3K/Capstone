'use client'
import React, { useEffect } from 'react'
import { useCustomizer } from '../hooks/useCustomizer'
import CustomizeModal from './CustomizeModal'

const ProductCustomizeButton = ({ productId, onCustomizationComplete, customClass }) => {
    const { isCustomizerOpen, customizationData, openCustomizer, closeCustomizer, handleSaveCustomization } =
        useCustomizer()

    // When component mounts, ensure Three.js canvas will have correct dimensions
    useEffect(() => {
        // Force window resize when component mounts to ensure proper rendering
        window.dispatchEvent(new Event('resize'))

        return () => {
            // Clean up any resources when component unmounts
            if (isCustomizerOpen) {
                closeCustomizer()
            }
        }
    }, [])

    // This function is called when customization is saved
    const handleSave = (data) => {
        // Process the customization data
        handleSaveCustomization(data)

        // Pass the data to the parent component's callback if provided
        if (onCustomizationComplete) {
            onCustomizationComplete({
                productId,
                modelType: data.modelType,
                color: data.color,
                shaderImage: data.shader,
                productImage: data.productImage,
                isFullTexture: data.isFullTexture,
                isLogoTexture: data.isLogoTexture,
                fullDecal: data.fullDecal,
                logoDecal: data.logoDecal
            })
        }
    }

    const handleButtonClick = () => {
        // Small delay to ensure any existing animations complete
        setTimeout(() => {
            openCustomizer()
        }, 10)
    }

    // Use either the provided customClass or fall back to the default styling
    const buttonClass =
        customClass ||
        'px-5 py-2.5 text-white rounded-lg transition-all shadow-lg font-medium bg-green-600 hover:bg-green-700 hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50'

    return (
        <>
            <div className='flex justify-end mt-6'>
                <button
                    onClick={handleButtonClick}
                    className='bg-[#16a34a] text-white rounded-[16px] px-6 h-[52px] min-w-[200px] font-medium text-base flex items-center justify-center'
                    style={{
                        backgroundColor: '#16a34a',
                        borderRadius: '24px',
                        padding: '14px 28px',
                        fontSize: '16px',
                        fontWeight: '500',
                        height: '56px',
                        minWidth: '240px',
                        border: 'none',
                        outline: 'none'
                    }}
                >
                    Design Your Own Product
                </button>
            </div>

            {/* The Customization Modal */}
            <CustomizeModal isOpen={isCustomizerOpen} onClose={closeCustomizer} onSave={handleSave} />
        </>
    )
}

export default ProductCustomizeButton
