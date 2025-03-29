import React, { useRef, useEffect, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Center, PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useSnapshot } from 'valtio'
import state from '../store'

import Shirt from './Shirt'
import Shirt2 from './Shirt2'
import Sweater from './Sweater'
import Backdrop from './Backdrop'
import CameraRig from './CameraRig'

// Model-specific configuration for proper centering and scaling
const modelConfigs = {
    shirt: {
        scale: 0.7,
        position: [0, 0, 0],
        cameraPosition: [0, 0, 4.0],
        showOrbitControls: false
    },
    shirt2: {
        scale: 0.9, // Slightly smaller scale for formal shirt
        position: [0, 0, 0],
        cameraPosition: [0, 0, 2.8]
    },
    sweater: {
        scale: 0.95,
        position: [0, 0, 0], // Center the sweater
        cameraPosition: [0, 0, 2.6]
    }
}

const CanvasModel = () => {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const snap = useSnapshot(state)
    const [loaded, setLoaded] = useState(false)

    // Set the current model type in state
    useEffect(() => {
        state.modelType = snap.modelType
        console.log(`Model type set to: ${snap.modelType}`)

        // Reset loaded state when model changes
        setLoaded(false)

        // Set loaded after a delay to ensure model is properly mounted
        const timer = setTimeout(() => {
            setLoaded(true)
            console.log(`Model ${snap.modelType} marked as loaded`)
        }, 500)

        return () => clearTimeout(timer)
    }, [snap.modelType])

    // Get the configuration for the current model
    const config = modelConfigs[snap.modelType] || modelConfigs.shirt

    // Debug the selected model
    useEffect(() => {
        console.log(`Canvas model changed to: ${snap.modelType}`)
        console.log('Using config:', config)
    }, [snap.modelType, config])

    // Prevent wheel scrolling on canvas
    useEffect(() => {
        const preventScroll = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener('wheel', preventScroll, { passive: false })
            container.addEventListener('touchmove', preventScroll, { passive: false })
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', preventScroll)
                container.removeEventListener('touchmove', preventScroll)
            }
        }
    }, [containerRef.current])

    // Ensure canvas responds to size changes
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                // Force Three.js to update its dimensions
                window.dispatchEvent(new Event('resize'))
            }
        }

        // Add event listeners for resize
        window.addEventListener('resize', handleResize)

        // Initial call to set dimensions
        handleResize()

        // Trigger multiple resize events after a short delay to ensure proper sizing
        const timer1 = setTimeout(() => {
            handleResize()
        }, 100)

        const timer2 = setTimeout(() => {
            handleResize()
        }, 300)

        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [snap.modelType, containerRef.current])

    // Canvas style based on model type
    const getCanvasStyle = () => {
        const baseStyle = {
            width: '100%',
            height: '100%',
            transition: 'all 0.5s ease-in-out',
            touchAction: 'none', // Prevents scroll on mobile touch
            outline: 'none'
        }

        return baseStyle
    }

    // Log when canvas is mounted
    const handleCanvasCreated = ({ gl, scene, camera }) => {
        // Initialize with proper transparency and pixel ratio
        gl.setClearColor(0xffffff, 0)
        gl.setPixelRatio(window.devicePixelRatio)

        // Log camera position for debugging
        console.log(`Camera initialized at position:`, camera.position)

        // Force multiple resize events to ensure canvas dimensions are correct
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 200)

        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 500)

        console.log(`Canvas for ${snap.modelType} created successfully`)
    }

    return (
        <div
            ref={containerRef}
            className='canvas-container'
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        >
            {console.log('Rendering Canvas with modelType:', snap.modelType)}
            <Canvas
                ref={canvasRef}
                shadows
                dpr={[1, 2]} // Responsive pixel ratio
                camera={{
                    position: config.cameraPosition,
                    fov: 30,
                    near: 0.1,
                    far: 1000
                }}
                gl={{
                    preserveDrawingBuffer: true,
                    antialias: true,
                    alpha: true
                }}
                style={getCanvasStyle()}
                onCreated={handleCanvasCreated}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[1, 1, 1]} intensity={0.9} />
                    <Environment preset='city' />
                    <Backdrop />

                    <CameraRig modelType={snap.modelType}>
                        <Center scale={config.scale} position={config.position}>
                            {console.log('Inside Center component, modelType:', snap.modelType)}
                            {snap.modelType === 'shirt' && <Shirt />}
                            {snap.modelType === 'shirt2' && <Shirt2 />}
                            {snap.modelType === 'sweater' && <Sweater />}
                        </Center>
                    </CameraRig>

                    <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 6} />
                </Suspense>
            </Canvas>
        </div>
    )
}

export default CanvasModel
