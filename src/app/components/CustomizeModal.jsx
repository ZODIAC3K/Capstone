'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSnapshot } from 'valtio'
import dynamic from 'next/dynamic'
import styles from './CustomizeModal.module.css'

import state from '../customization/store'
import { downloadCanvasToImage, reader } from '../customization/config/helpers'
import { EditorTabs, FilterTabs, DecalTypes } from '../customization/config/constants'
import { AIPicker, ColorPicker, CustomButton, FilePicker, Tab } from '../customization/components'

// Dynamic import with no SSR to avoid hydration issues
const Canvas = dynamic(() => import('../customization/canvas'), { ssr: false })

// Check if we're running on the client side
const isClient = typeof window !== 'undefined'

const CustomizeModal = ({ isOpen, onClose, onSave }) => {
    const snap = useSnapshot(state)
    const modalRef = useRef(null)
    const canvasContainerRef = useRef(null)

    const [file, setFile] = useState('')
    const [prompt, setPrompt] = useState('')
    const [generatingImg, setGeneratingImg] = useState(false)
    const [activeEditorTab, setActiveEditorTab] = useState('')
    const [activeFilterTab, setActiveFilterTab] = useState({
        logoShirt: true,
        stylishShirt: false
    })
    const [selectedModel, setSelectedModel] = useState('shirt')
    const [canvasRendered, setCanvasRendered] = useState(false)
    const [canvasHeight, setCanvasHeight] = useState(500)
    const [prevScrollPosition, setPrevScrollPosition] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    // Available 3D models
    const models = [
        { id: 'shirt', name: 'T-Shirt' },
        { id: 'shirt2', name: 'Formal Shirt' },
        { id: 'sweater', name: 'V-Neck Sweater' },
        { id: 'pant', name: 'Pants' }
    ]

    // Calculate canvas height based on container size
    useEffect(() => {
        const adjustCanvasHeight = () => {
            if (canvasContainerRef.current) {
                const containerWidth = canvasContainerRef.current.clientWidth
                const containerHeight = canvasContainerRef.current.clientHeight
                setCanvasHeight(Math.max(containerHeight, 500))
            }
        }

        if (isClient && isOpen) {
            // Initial calculation
            adjustCanvasHeight()

            // Add resize listener
            window.addEventListener('resize', adjustCanvasHeight)

            // Force resize event to help canvas adjust
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'))
            }, 100)
        }

        return () => {
            if (isClient) {
                window.removeEventListener('resize', adjustCanvasHeight)
            }
        }
    }, [isOpen, canvasContainerRef.current])

    // Add this useEffect to ensure the model is properly initialized on first load
    useEffect(() => {
        // Pre-warm the three.js cache before the modal is opened
        if (isClient && !window._preWarmedThreeJS) {
            // Import the models in the background
            import('../customization/canvas')

            // Set a flag to avoid doing this again
            window._preWarmedThreeJS = true
        }
    }, [])

    // Update the reset state when modal opens to ensure proper first render
    useEffect(() => {
        if (isOpen) {
            // Reset state
            state.intro = false
            state.color = '#EFBD48'
            state.isLogoTexture = true
            state.isFullTexture = false
            state.modelType = 'shirt'
            setSelectedModel('shirt')
            setCanvasRendered(false)

            // Clear any previous canvas
            if (isClient) {
                const existingCanvas = document.querySelector('canvas')
                if (existingCanvas && existingCanvas.parentNode) {
                    existingCanvas.parentNode.removeChild(existingCanvas)
                }
            }

            // Add a small delay before showing the loading indicator
            setTimeout(() => {
                // Allow time for the modal to fully open before rendering canvas
                const timer = setTimeout(() => {
                    console.log('Setting canvasRendered to true with modelType:', state.modelType)
                    setCanvasRendered(true)

                    // Force multiple window resize events for Three.js to recalculate dimensions
                    if (isClient) {
                        window.dispatchEvent(new Event('resize'))

                        // Additional resize events to ensure proper initialization
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'))
                        }, 100)

                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'))
                        }, 300)
                    }
                }, 300)

                return () => clearTimeout(timer)
            }, 50)
        } else {
            setCanvasRendered(false)
        }
    }, [isOpen])

    // Handle window resize for canvas after model change
    useEffect(() => {
        if (isClient && isOpen && canvasRendered) {
            // Force window resize to help canvas adjust
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event('resize'))
            }, 100)

            return () => clearTimeout(timer)
        }
    }, [isOpen, selectedModel, canvasRendered])

    // Add wheel event prevention for the canvas container
    useEffect(() => {
        // Function to prevent scrolling on the canvas
        const preventScroll = (e) => {
            if (canvasRendered) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        // Get the canvas container element
        const canvasContainer = canvasContainerRef.current

        if (isClient && isOpen && canvasContainer) {
            // Add wheel event listener to prevent scrolling
            canvasContainer.addEventListener('wheel', preventScroll, { passive: false })

            // Add touch event listeners to prevent pinch zooming
            canvasContainer.addEventListener('touchmove', preventScroll, { passive: false })

            // Log that we've attached the event handlers
            console.log('Attached scroll prevention handlers')
        }

        return () => {
            if (canvasContainer) {
                canvasContainer.removeEventListener('wheel', preventScroll)
                canvasContainer.removeEventListener('touchmove', preventScroll)
                console.log('Removed scroll prevention handlers')
            }
        }
    }, [isOpen, canvasRendered, isClient])

    // Add cleanup when modal closes
    useEffect(() => {
        // Cleanup function to remove any handlers and reset state when modal closes
        return () => {
            if (canvasContainerRef.current) {
                // Remove any event listeners that might be attached
                const canvasContainer = canvasContainerRef.current
                canvasContainer.removeEventListener('wheel', () => {}, { passive: false })
                canvasContainer.removeEventListener('touchmove', () => {}, { passive: false })
            }

            // Reset state variables
            setCanvasRendered(false)
            setPrevScrollPosition(0)

            // Reset body style
            document.body.style.overflow = ''
        }
    }, [])

    // Also freeze body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            setPrevScrollPosition(window.scrollY)
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden'
        } else {
            // Restore body scrolling when modal is closed
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Pre-warm the three.js cache by importing models in the background
    useEffect(() => {
        // Pre-load all models when the modal is opened for the first time
        if (isOpen) {
            state.modelType = 'shirt' // Default to shirt initially
            console.log('Pre-warming Three.js cache with initial model load')
        }
    }, [isOpen])

    const generateTabContent = () => {
        switch (activeEditorTab) {
            case 'colorpicker':
                return <ColorPicker />
            case 'filepicker':
                return <FilePicker file={file} setFile={setFile} readFile={readFile} />
            case 'aipicker':
                return (
                    <AIPicker
                        prompt={prompt}
                        setPrompt={setPrompt}
                        generatingImg={generatingImg}
                        handleSubmit={handleSubmit}
                    />
                )
            default:
                return null
        }
    }

    const handleSubmit = async (type) => {
        if (!prompt) return alert('Please enter a prompt')

        try {
            setGeneratingImg(true)

            const response = await fetch('/api/genAI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${prompt}, high quality, detailed, clean background, vector style, logo design`
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to generate image')
            }

            const data = await response.json()

            if (!data.photo) {
                throw new Error('No image data received')
            }

            handleDecals(type, `data:image/png;base64,${data.photo}`)
        } catch (error) {
            alert(error.message)
        } finally {
            setGeneratingImg(false)
            setActiveEditorTab('')
        }
    }

    const handleDecals = (type, result) => {
        const decalType = DecalTypes[type]
        state[decalType.stateProperty] = result

        if (!activeFilterTab[decalType.filterTab]) {
            handleActiveFilterTab(decalType.filterTab)
        }
    }

    const handleActiveFilterTab = (tabName) => {
        switch (tabName) {
            case 'logoShirt':
                state.isLogoTexture = !activeFilterTab[tabName]
                break
            case 'stylishShirt':
                state.isFullTexture = !activeFilterTab[tabName]
                break
            default:
                state.isLogoTexture = true
                state.isFullTexture = false
                break
        }

        setActiveFilterTab((prevState) => ({
            ...prevState,
            [tabName]: !prevState[tabName]
        }))
    }

    const readFile = (type) => {
        reader(file).then((result) => {
            handleDecals(type, result)
            setActiveEditorTab('')
        })
    }

    const handleSave = () => {
        // Get canvas element
        const canvas = document.querySelector('canvas')

        if (!canvas) {
            alert('Could not find canvas element')
            return
        }

        try {
            // Create simplified product data object with what's needed
            const productData = {
                modelType: state.modelType,
                color: state.color,
                shader: state.isFullTexture ? state.fullDecal : state.logoDecal,
                productImage: canvas.toDataURL('image/png')
            }

            // Pass data back to parent component
            onSave(productData)
            onClose()
        } catch (error) {
            console.error('Error saving customization:', error)
            alert('There was an error saving your customization. Please try again.')
        }
    }

    // Handle model change with improved animation and timing
    const handleModelChange = (model) => {
        try {
            // Store current scroll position
            const scrollPos = window.scrollY

            // Set loading state while changing models
            setIsLoading(true)
            setSelectedModel(model)

            // Update the model type in the global state
            state.modelType = model
            console.log('Model changed to:', model)

            // Clear any existing canvas
            if (isClient) {
                const existingCanvas = document.querySelector('canvas')
                if (existingCanvas && existingCanvas.parentNode) {
                    console.log('Removing existing canvas')
                    existingCanvas.parentNode.removeChild(existingCanvas)
                }
            }

            // Use a slightly longer delay for loading
            setTimeout(() => {
                // Force re-render canvas
                setCanvasRendered(false)

                setTimeout(() => {
                    setCanvasRendered(true)
                    console.log('Re-rendering canvas for model:', model)

                    // Trigger multiple resize events to ensure Three.js recalculates dimensions
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'))
                        }, i * 100)
                    }

                    // Restore scroll position
                    window.scrollTo(0, scrollPos)

                    // Finish loading
                    setIsLoading(false)
                }, 100)
            }, 200)
        } catch (error) {
            console.error('Error changing model:', error)
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className={styles.modalOverlay} ref={modalRef}>
            <div className={styles.modalContainer}>
                <div className={styles.headerControls}>
                    <button onClick={onClose} className={styles.closeButtonInner}>
                        ✕
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {/* Canvas Area - 70% with proper padding for spacing */}
                    <div className={styles.canvasContainer} ref={canvasContainerRef}>
                        <div className={styles.canvasInner}>
                            {/* Show a loading indicator while canvas is initializing */}
                            {!canvasRendered && (
                                <div className={styles.loadingIndicator}>
                                    <div className={styles.spinner}></div>
                                    <p className={styles.loadingText}>Loading 3D Model...</p>
                                </div>
                            )}

                            {/* Only render canvas when ready */}
                            <div
                                className={`${styles.canvasWrapper} ${canvasRendered ? styles.visible : styles.hidden}`}
                            >
                                {isClient && canvasRendered && (
                                    <>
                                        {console.log('Rendering Canvas component with modelType:', state.modelType)}
                                        <Canvas cloth={state.modelType} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls Area - 30% */}
                    <div className={styles.controlsContainer}>
                        <h2 className={styles.heading}>Customize Your Product</h2>

                        {/* Model Selection */}
                        <div className={styles.section}>
                            <label className={styles.label}>Select Model</label>
                            <select
                                value={state.modelType}
                                onChange={(e) => handleModelChange(e.target.value)}
                                className={styles.select}
                            >
                                {models.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Editor Tools */}
                        <div className={styles.section}>
                            <h3 className={styles.subheading}>Edit Tools</h3>
                            <div className={styles.toolsGrid}>
                                {EditorTabs.map((tab) => (
                                    <button
                                        key={tab.name}
                                        className={`${styles.toolButton} ${
                                            activeEditorTab === tab.name ? styles.activeToolButton : ''
                                        }`}
                                        onClick={() =>
                                            setActiveEditorTab((prev) => (prev === tab.name ? '' : tab.name))
                                        }
                                    >
                                        <img src={tab.icon} alt={tab.name} className={styles.toolIcon} />
                                    </button>
                                ))}
                            </div>
                            <div className={styles.tabContent}>{generateTabContent()}</div>
                        </div>

                        {/* Filter Options */}
                        <div className={styles.section}>
                            <h3 className={styles.subheading}>Apply Texture</h3>
                            <div className={styles.toolsGrid}>
                                {FilterTabs.map((tab) => (
                                    <button
                                        key={tab.name}
                                        className={`${styles.toolButton} ${
                                            activeFilterTab[tab.name] ? styles.activeToolButton : ''
                                        }`}
                                        onClick={() => handleActiveFilterTab(tab.name)}
                                    >
                                        <img src={tab.icon} alt={tab.name} className={styles.toolIcon} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className={styles.saveButtonContainer}>
                            <button className={styles.saveButton} onClick={handleSave} disabled={!canvasRendered}>
                                Save & Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomizeModal
