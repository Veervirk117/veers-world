// src/Sky.jsx
import React from "react";
import { Sky, Stars } from "@react-three/drei";
import * as THREE from "three";

export default function NightSky() {
  return (
    <>
      {/* Dim atmospheric base — mostly for horizon tone */}
      <Sky
        distance={450000}
        sunPosition={[10, -0.1, -1]}
        inclination={0}
        azimuth={0.25}
        turbidity={0.5}
        rayleigh={0.2}
        mieCoefficient={0.01}
        mieDirectionalG={0.9}
      />

      {/* Star field */}
      <Stars
        radius={100}       // how far stars spread from camera
        depth={80}         // how thick star field layers are
        count={7000}       // number of stars
        factor={10}         // star size
        saturation={10}     // keep them white
        fade={true}        // fade on edges for realism
        speed={0.3}        // subtle twinkle motion
      />

      {/* Moon */}
      <mesh position={[60, 30, -200]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          emissive={new THREE.Color("#dcdcff")}
          emissiveIntensity={10}
          color="#ffffff"
        />
      </mesh>
    </>
  );
}
