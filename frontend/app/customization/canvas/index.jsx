import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Center } from "@react-three/drei";

import Shirt from "./Shirt";
import Shirt2 from "./Shirt2";
import Sweater from "./Sweater";
import Pant from "./Pant";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";

const CanvasModel = ({ cloth = "pant" }) => {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 0, 0], fov: 25 }}
            gl={{ preserveDrawingBuffer: true }} //to preserve the buffers
            className='w-full max-w-full h-full transition-all ease-in'
        >
            <ambientLight intensity={0.5} />
            <Environment preset='city' />

            <CameraRig>
                <Backdrop />
                <Center>
                    {cloth === "shirt" && <Shirt />}
                    {cloth === "pant" && <Pant />}
                    {cloth === "shirt2" && <Shirt2 />}
                    {cloth === "sweater" && <Sweater />}
                </Center>
            </CameraRig>
        </Canvas>
    );
};

export default CanvasModel;
