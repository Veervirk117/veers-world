import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const DPR = 0.5;

export default function FogShader() {
  const mesh = useRef();
  const { viewport, camera } = useThree();

  // Shader uniforms
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth * DPR, window.innerHeight * DPR) },
    uFogColor: { value: new THREE.Color(0.25, 0.0, 0.3) }, // Customize fog color
    uFogDensity: { value: 0.7 },
    uFogOffset: { value: 5.0 },
    uCameraPosition: { value: camera.position.clone() },
  };

  useFrame(() => {
    uniforms.uTime.value = performance.now() * 0.001;
    uniforms.uResolution.value.set(window.innerWidth * DPR, window.innerHeight * DPR);
    uniforms.uCameraPosition.value.copy(camera.position);
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec3 uFogColor;
          uniform float uFogDensity;
          uniform float uFogOffset;

          varying vec2 vUv;

          void main() {
            // Ray origin and direction
            vec3 ro = vec3(0.0, 0.0, 5.0); // camera position
            vec3 rd = normalize(vec3((vUv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0), -1.0));

            // Fake distance for demo: z of ray direction
            float dist = length(rd * 10.0); // increase multiplier for longer fog range

            // Fog factor
            float fog = exp(-uFogDensity * max(dist - uFogOffset, 0.0));

            // Blend with fog color
            vec3 color = mix(uFogColor, vec3(1.0), fog); // background is white

            gl_FragColor = vec4(color, 1.0);
          }
        `}
        transparent={true}
      />
    </mesh>
  );
}
