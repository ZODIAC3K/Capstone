import React, { useEffect, useState, useRef } from 'react'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Decal } from '@react-three/drei'
import * as THREE from 'three'

import state from '../store'

export function Shirt2(props) {
    console.log('Rendering Shirt2 component')
    const snap = useSnapshot(state)
    const shirtRef = useRef()
    const [modelLoaded, setModelLoaded] = useState(false)
    const [modelError, setModelError] = useState(null)

    // Try loading the model with error handling
    let gltf = null
    try {
        gltf = useGLTF('/shirt_for_men.glb')
    } catch (error) {
        console.error('Error loading formal shirt model:', error)
        setModelError(error.message)
    }

    // Check if model loaded correctly
    const { nodes, materials } = gltf || { nodes: null, materials: null }

    // Log when model loads successfully
    useEffect(() => {
        if (nodes && materials) {
            console.log('Formal shirt model loaded successfully')
            console.log('Available nodes:', Object.keys(nodes))
            console.log('Available materials:', Object.keys(materials))
            setModelLoaded(true)
        }
    }, [nodes, materials])

    // Load uploaded textures (if any)
    const logoTexture = snap.logoDecal ? useTexture(snap.logoDecal) : null
    const fullTexture = snap.fullDecal ? useTexture(snap.fullDecal) : null

    useEffect(() => {
        console.log('Textures updated:', {
            logo: snap.logoDecal,
            full: snap.fullDecal
        })
    }, [snap.logoDecal, snap.fullDecal])

    // If model failed to load, show a fallback
    if (modelError || !nodes || !materials) {
        console.warn('Using fallback mesh for formal shirt')
        return (
            <group {...props}>
                <mesh>
                    <boxGeometry args={[1, 1.5, 0.5]} />
                    <meshStandardMaterial color='gray' />
                </mesh>
            </group>
        )
    }

    useFrame((state, delta) => {
        if (materials) {
            Object.values(materials).forEach((material) => {
                if (material) {
                    easing.dampC(material.color, snap.color, 0.25, delta)
                    material.needsUpdate = true
                }
            })
        }
    })

    // Look for the first valid geometry node
    const mainNode = nodes.ChemiseHomme_FABRIC_1_FRONT_327585_0 || Object.values(nodes).find((node) => node.geometry)

    if (!mainNode) {
        console.error('No valid geometry found in formal shirt model')
        return null
    }

    return (
        <group ref={shirtRef} {...props} dispose={null} scale={0.008}>
            <mesh
                castShadow
                receiveShadow
                geometry={mainNode.geometry}
                material={
                    materials.FABRIC_1_FRONT_327585 ||
                    new THREE.MeshStandardMaterial({
                        color: snap.color,
                        roughness: 0.8,
                        metalness: 0.05
                    })
                }
            >
                {snap.isFullTexture && fullTexture && (
                    <Decal
                        position={[0, 0.25, 0.5]}
                        rotation={[0, 0, 0]}
                        scale={1.25} // Larger to ensure coverage on formal shirt
                        map={fullTexture}
                        depthTest={false}
                        depthWrite={true}
                    />
                )}

                {snap.isLogoTexture && logoTexture && (
                    <Decal
                        position={[0, 0.25, 0.5]}
                        rotation={[0, 0, 0]}
                        scale={0.35}
                        map={logoTexture}
                        anisotropy={16}
                        depthTest={false}
                        depthWrite={true}
                    />
                )}
            </mesh>

            {nodes.ChemiseHomme_Material327563_0 && (
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.ChemiseHomme_Material327563_0.geometry}
                    material={
                        materials.Material327563 ||
                        new THREE.MeshStandardMaterial({
                            color: snap.color,
                            roughness: 0.8,
                            metalness: 0.05
                        })
                    }
                />
            )}
        </group>
    )
}

// Preload the model
useGLTF.preload('/shirt_for_men.glb')
export default Shirt2
