import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import state from '../store'

// Define specific adjustments for each model
const modelAdjustments = {
    shirt: {
        targetPosition: [0, 0, 2.7],
        mobilePosition: [0, 0, 3.2]
    },
    shirt2: {
        targetPosition: [0, 0, 2.8],
        mobilePosition: [0, 0, 3.6]
    },
    sweater: {
        targetPosition: [0, 0, 2.9],
        mobilePosition: [0, 0, 3.8]
    },
    pant: {
        targetPosition: [0, 0, 3.0],
        mobilePosition: [0, 0, 3.6]
    }
}

const CameraRig = ({ children, modelType }) => {
    const group = useRef()
    const snap = useSnapshot(state)

    useFrame((state, delta) => {
        const adjustments = modelAdjustments[modelType] || modelAdjustments.shirt
        const isBreakpoint = window.innerWidth <= 1260
        const isMobile = window.innerWidth <= 600

        // set the initial position of the model
        let targetPosition = [0, 0, 0]

        if (modelType === 'pant') {
            group.current.position.y = -0.3 // Slightly lower for pants
        } else if (snap.intro) {
            // Default position for intro view
            targetPosition = [0, 0, 2]
        } else {
            // Adjust based on model and screen size
            if (isBreakpoint) {
                targetPosition = [0, 0, 2.5]
            } else {
                targetPosition = adjustments.targetPosition
            }

            if (isMobile) {
                targetPosition = adjustments.mobilePosition
            }
        }

        // set model camera position
        easing.damp3(state.camera.position, targetPosition, 0.25, delta)

        // set the model rotation smoothly
        if (group.current) {
            easing.dampE(group.current.rotation, [state.pointer.y / 10, -state.pointer.x / 5, 0], 0.25, delta)
        }
    })

    return <group ref={group}>{children}</group>
}

export default CameraRig
