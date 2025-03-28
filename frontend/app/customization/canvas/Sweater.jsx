import React, { useEffect } from "react";
import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Decal } from "@react-three/drei";

import state from "../store";

export function Sweater(props) {
    const snap = useSnapshot(state);
    const gltf = useGLTF("/v_neck_sweater.glb");

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
        <group {...props} dispose={null}>
            <group scale={0.01}>
                {Object.keys(nodes).map((key, index) => {
                    const node = nodes[key];
                    const material = node.material
                        ? materials[node.material.name]
                        : null;

                    if (!node.geometry || !material) return null; // Safety check

                    return (
                        <mesh
                            key={index}
                            castShadow
                            receiveShadow
                            geometry={node.geometry}
                            material={material}
                        >
                            {fullTexture && (
                                <Decal
                                    position={[0, 0, 0]}
                                    rotation={[0, 0, 0]}
                                    scale={1} // Covers full sweater
                                    map={fullTexture}
                                />
                            )}
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}

useGLTF.preload("/v_neck_sweater.glb");
export default Sweater;
