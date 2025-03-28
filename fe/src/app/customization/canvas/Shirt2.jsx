import React, { useEffect } from "react";
import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Decal } from "@react-three/drei";

import state from "../store";

export function Shirt2(props) {
    const snap = useSnapshot(state);
    const gltf = useGLTF("/shirt_for_men.glb");

    // Ensure GLTF is loaded properly
    if (!gltf || !gltf.nodes || !gltf.materials) {
        console.error("GLTF file not loaded correctly!");
        return null;
    }

    const { nodes, materials } = gltf;

    // Load uploaded texture (if any)
    const fullTexture = snap.fullDecal ? useTexture(snap.fullDecal) : null;

    useEffect(() => {
        console.log("Texture updated:", snap.fullDecal);
    }, [snap.fullDecal]);

    useFrame((state, delta) => {
        Object.values(materials).forEach((material) => {
            if (material) {
                easing.dampC(material.color, snap.color, 0.25, delta);
                material.map = fullTexture || null; // Apply texture only if available
                material.needsUpdate = true;
            }
        });
    });

    return (
        <group {...props} dispose={null} scale={0.01}>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.ChemiseHomme_FABRIC_1_FRONT_327585_0.geometry}
                material={materials.FABRIC_1_FRONT_327585}
            >
                {fullTexture && (
                    <Decal
                        position={[0, 0, 0]}
                        rotation={[0, 0, 0]}
                        scale={1} // Covers full shirt
                        map={fullTexture}
                    />
                )}
            </mesh>

            <mesh
                castShadow
                receiveShadow
                geometry={nodes.ChemiseHomme_Material327563_0.geometry}
                material={materials.Material327563}
            />
        </group>
    );
}

useGLTF.preload("/shirt_for_men.glb");
export default Shirt2;
