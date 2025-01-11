import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text } from '@react-three/drei';

function TShirtModel({
  color

}: {
  color: string;
}) {
  const modelPath = '/hoodie_type1.glb';
  const model = useGLTF(modelPath);
  const { nodes, materials } = model;


  return (
    <>
      <mesh
        geometry={nodes["Cloth"].geometry}
        castShadow
        receiveShadow
        position={[0,-20, -40]}
        rotation={[Math.PI/2, 0, 0]}
        scale={8}
      >
        <meshPhysicalMaterial
          map={materials["FABRIC_1_FRONT_2212"].map}
          color={color}
        />
      </mesh>
    </>
  );
}

export default function TShirt3D({ color }: { color: string }) {
  return (
    <div>

      {/* 3D Canvas */}
      <div className="h-[400px] w-full">
        <Canvas camera={{ position: [0, 0, 0], fov: 25 }}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          {/* Model */}
          <TShirtModel
            color={color}
          />

          {/* Camera Controls */}
          <OrbitControls target={[0,-10, -40]} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload('/hoodie_type1.glb');
