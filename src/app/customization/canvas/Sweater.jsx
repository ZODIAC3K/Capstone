import React, { useEffect, useState, useRef } from 'react'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Decal } from '@react-three/drei'
import * as THREE from 'three'

import state from '../store'

export function Sweater(props) {
    console.log('Rendering Sweater component')
    const snap = useSnapshot(state)
    const sweaterRef = useRef()
    const [modelLoaded, setModelLoaded] = useState(false)
    const [modelError, setModelError] = useState(null)

    // Try loading the model with error handling
    let gltf = null
    try {
        gltf = useGLTF('/v_neck_sweater.glb')
    } catch (error) {
        console.error('Error loading sweater model:', error)
        setModelError(error.message)
    }

    // Check if model loaded correctly
    const { nodes, materials } = gltf || { nodes: null, materials: null }

    // Log when model loads successfully
    useEffect(() => {
        if (nodes && materials) {
            console.log('Sweater model loaded successfully')
            console.log('Available nodes:', Object.keys(nodes))
            console.log('Available materials:', Object.keys(materials))
            setModelLoaded(true)
        }
    }, [nodes, materials])

    // Load uploaded texture (if any)
    const fullTexture = snap.fullDecal ? useTexture(snap.fullDecal) : null

    useEffect(() => {
        console.log('Texture updated for sweater:', snap.fullDecal)
    }, [snap.fullDecal])

    // If model failed to load, show a fallback
    if (modelError || !nodes || !materials) {
        console.warn('Using fallback mesh for sweater')
        return (
            <group {...props}>
                <mesh>
                    <boxGeometry args={[1, 1.5, 0.5]} />
                    <meshStandardMaterial color='darkblue' />
                </mesh>
            </group>
        )
    }

    useFrame((state, delta) => {
        if (materials) {
            Object.values(materials).forEach((material) => {
                if (material) {
                    easing.dampC(material.color, snap.color, 0.25, delta)

                    // Apply texture only in full texture mode
                    if (snap.isFullTexture && fullTexture) {
                        material.map = fullTexture
                    }

                    material.needsUpdate = true
                }
            })
        }
    })

    // Filter out nodes with valid geometry
    const validNodes = Object.keys(nodes).filter(
        (key) => nodes[key].geometry && nodes[key].type !== 'Bone' && nodes[key].type !== 'Object3D'
    )

    if (validNodes.length === 0) {
        console.error('No valid geometry found in sweater model')
        return null
    }

    console.log(`Found ${validNodes.length} valid meshes in sweater model`)

    return (
        <group ref={sweaterRef} {...props} dispose={null} position={[0, 0, 0]}>
            <group scale={0.01} position={[0, 0, 0]}>
                {validNodes.map((key, index) => {
                    const node = nodes[key]
                    // Get material if available or create a new one
                    const material =
                        node.material && materials[node.material.name]
                            ? materials[node.material.name]
                            : new THREE.MeshStandardMaterial({
                                  color: snap.color,
                                  roughness: 0.7,
                                  metalness: 0.05
                              })

                    return (
                        <mesh key={index} castShadow receiveShadow geometry={node.geometry} material={material}>
                            {snap.isFullTexture && fullTexture && (
                                <Decal
                                    position={[0, 0, 0]}
                                    rotation={[0, 0, 0]}
                                    scale={1} // Covers full sweater
                                    map={fullTexture}
                                />
                            )}
                        </mesh>
                    )
                })}
            </group>
        </group>
    )
}

// Preload the model
useGLTF.preload('/v_neck_sweater.glb')
export default Sweater
