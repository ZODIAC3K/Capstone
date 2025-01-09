import React, { useEffect } from 'react'; // Add this import
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame } from '@react-three/fiber';
import { Decal, useGLTF, useTexture } from '@react-three/drei';

import state from '../store';

const Shirt = () => {
  const snap = useSnapshot(state);
//   importing the shirt 3d file from public folder
  const { nodes, materials } = useGLTF('/shirt_baked.glb');



  useEffect(() => {
    // Debug log when texture changes
    console.log('Texture updated:', {
      logo: !!snap.logoDecal,
      full: !!snap.fullDecal
    });
  }, [snap.logoDecal, snap.fullDecal]);



  //textures for shirt
  const logoTexture = useTexture(snap.logoDecal);   //for the middle of the screen
  const fullTexture = useTexture(snap.fullDecal);   //it will go for the entire shirt

  useFrame((state, delta) => easing.dampC(materials.lambert1.color, snap.color, 0.25, delta));

  const stateString = JSON.stringify(snap); //so that the shirts update automatically after change is applied

  return (
    <group key={stateString}>
      <mesh
        castShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={materials.lambert1}
        material-roughness={1}
        dispose={null}
      >

{/*placing texture */}
        {snap.isFullTexture && (
          <Decal 
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}  //to take full space of the model
            map={fullTexture}
          />
        )}

{/* placing logo */}
        {snap.isLogoTexture && (
          <Decal 
            position={[0, 0.04, 0.15]}
            rotation={[0, 0, 0]}
            scale={0.15}
            map={logoTexture}
            anisotropy={16} //to change the quality of the texture
            depthTest={false} //it is going to ensure to render On top of the other objects in the scene
            depthWrite={true}
          />
        )}
      </mesh>
    </group>
  )
}

export default Shirt