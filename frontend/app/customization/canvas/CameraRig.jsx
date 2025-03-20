import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import state from '../store'

const CameraRig = ({ children }) => {
    const group = useRef()
    const snap = useSnapshot(state)

    useFrame((state, delta) => {
        //shirt size on differt screen
        const isBreakpoint = window.innerWidth <= 1260 //for window
        const isMobile = window.innerWidth <= 600 //for mobile

        // setting the initial position of the model
        let targetPosition = [-0.4, 0, 2]

        // if we r on home page then repositioning it
        if (snap.intro) {
            if (isBreakpoint) targetPosition = [0, 0, 2]
            if (isMobile) targetPosition = [0, 0.2, 2.5]
        }
        // if on customiser page
        else {
            if (isMobile) targetPosition = [0, 0, 2.5]
            else targetPosition = [0, 0, 1.85]
        }

        // setting model camera position
        easing.damp3(state.camera.position, targetPosition, 1.25, delta)

        // setting the model rotation smoothly
        easing.dampE(
            group.current.rotation,
            // [state.pointer.y / 10, -state.pointer.x / 5, 0],
            // [state.pointer.y / 2, -state.pointer.x / 0.15 , 0], ////rotation front back
            [state.pointer.y / 2, -state.pointer.x / 2, 0], /////silgth rotation in x
            0.25, //smooth time
            delta //from useframe hook
        )
    })

    return <group ref={group}>{children}</group>
}

export default CameraRig
