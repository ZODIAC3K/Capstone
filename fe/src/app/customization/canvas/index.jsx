import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Center } from '@react-three/drei'

import Shirt from './Shirt'
import Shirt2 from './Shirt2'
import Sweater from './Sweater'
import Pant from './Pant'
import Backdrop from './Backdrop'
import CameraRig from './CameraRig'

const CanvasModel = ({ cloth }) => {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 0, 0], fov: 25 }}
            gl={{ preserveDrawingBuffer: true }} //to preserve the buffers
            style={{
                width: '100%',
                maxWidth: '100%',
                height: '100vh',
                transition: 'all 0.3s ease-in'
            }}
        >
            <ambientLight intensity={0.5} />
            <Environment preset='city' />

            <CameraRig>
                <Backdrop />
                <Center>
                   {cloth == 'shirt' && <Shirt />}
                   {cloth== 'sweater' && <Sweater />}
                   {cloth == 'pant' && <Pant />}
                   {cloth == 'shirt2' && <Shirt2 />}
                </Center>
            </CameraRig>
        </Canvas>
    )
}

export default CanvasModel
