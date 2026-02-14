// Raymarching.jsx
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import vertexShader from "./vertexShader.glsl?raw";
import fragmentShader from "./fragmentShader.glsl?raw";

const DPR = 0.5;
const BLUE_NOISE_TEXTURE_URL = "https://cdn.maximeheckel.com/noises/blue-noise.png";
const NOISE_TEXTURE_URL = "https://cdn.maximeheckel.com/noises/noise2.png";

export default function Raymarching() {
  const mesh = useRef();
  const { viewport, camera } = useThree();

  // Load textures
  const blueNoiseTexture = useTexture(BLUE_NOISE_TEXTURE_URL);
  const noisetexture = useTexture(NOISE_TEXTURE_URL);

  [blueNoiseTexture, noisetexture].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
    tex.magFilter = THREE.NearestMipmapLinearFilter;
  });

  // Shader uniforms
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth * DPR, window.innerHeight * DPR) },
    uNoise: { value: noisetexture },
    uBlueNoise: { value: blueNoiseTexture },
    uFrame: { value: 0 },
    uCameraPosition: { value: camera.position.clone() },
    uCameraMatrix: { value: new THREE.Matrix3().setFromMatrix4(camera.matrixWorld) },
  };

  useFrame(() => {
    if (!mesh.current) return;

    // Update time and frame
    uniforms.uTime.value = performance.now() * 0.001;
    uniforms.uFrame.value += 1;

    // Update resolution
    uniforms.uResolution.value.set(window.innerWidth * DPR, window.innerHeight * DPR);

    // Update camera uniforms
    uniforms.uCameraPosition.value.copy(camera.position);
    uniforms.uCameraMatrix.value.setFromMatrix4(camera.matrixWorld);
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true} // allows blending with scene
      />
    </mesh>
  );
}
