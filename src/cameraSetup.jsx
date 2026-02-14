import { useThree } from "@react-three/fiber";
import { useState } from "react";

export default function CameraBlueprint() {
  const { camera } = useThree();
  const [keyframes, setKeyframes] = useState([]);

  // Save current camera position as a keyframe
  const saveKeyframe = () => {
    setKeyframes(prev => {
      const newKeyframes = [
        ...prev,
        {
          position: camera.position.clone(),
          rotation: camera.rotation.clone()
        }
      ];
      const position = [
        Number(camera.position.x.toFixed(2)),
        Number(camera.position.y.toFixed(2)),
        Number(camera.position.z.toFixed(2)),
      ];
      const rotation = [
        Number(camera.rotation.x.toFixed(2)),
        Number(camera.rotation.y.toFixed(2)),
        Number(camera.rotation.z.toFixed(2)),
      ];
      console.log("Keyframe saved:", newKeyframes.length, { position, rotation });
      return newKeyframes;
    });
  };

  return (
    <>
      {/* Click this sphere to record camera keyframe */}
      <mesh position={[-1.59, 0.34, -4.41]} onPointerDown={saveKeyframe}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </>
  );
}
