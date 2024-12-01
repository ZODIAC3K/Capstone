import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function TShirtModel({ color }: { color: string }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)

  useFrame((state, delta) => {
    mesh.current.rotation.y += delta * 0.2
  })

  return (
    <mesh
      ref={mesh}
      scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <cylinderGeometry args={[1, 1.5, 2, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function TShirt3D({ color }: { color: string }) {
  return (
    <div className="h-[400px] w-full">
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <TShirtModel color={color} />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

