'use client'
import { useState, useCallback } from 'react'

export const useCustomizer = () => {
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
    const [customizationData, setCustomizationData] = useState(null)

    const openCustomizer = useCallback(() => {
        window.dispatchEvent(new Event('resize'))

        setTimeout(() => {
            setIsCustomizerOpen(true)
        }, 50)
    }, [])

    const closeCustomizer = useCallback(() => {
        setIsCustomizerOpen(false)

        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 200)
    }, [])

    const handleSaveCustomization = useCallback((data) => {
        setCustomizationData(data)
    }, [])

    return {
        isCustomizerOpen,
        customizationData,
        openCustomizer,
        closeCustomizer,
        handleSaveCustomization
    }
}

export default useCustomizer
