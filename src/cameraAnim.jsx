import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function CameraAnimation({
  duration = 6,
  startDelay = 0,
  playing = true,
  keyframes,
  onComplete,
}) {
  const { camera } = useThree();
  const startTimeRef = useRef(null);
  const doneRef = useRef(false);

  const frames = useMemo(() => {
    if (!keyframes || keyframes.length < 2) return [];
    return keyframes.map((kf) => {
      const position = new THREE.Vector3(
        kf.position[0],
        kf.position[1],
        kf.position[2]
      );
      const rotation = new THREE.Euler(
        kf.rotation[0],
        kf.rotation[1],
        kf.rotation[2]
      );
      const quaternion = new THREE.Quaternion().setFromEuler(rotation);
      return { position, quaternion };
    });
  }, [keyframes]);

  const curve = useMemo(() => {
    if (frames.length < 2) return null;
    return new THREE.CatmullRomCurve3(
      frames.map((frame) => frame.position),
      false,
      "catmullrom",
      0.5
    );
  }, [frames]);

  const distanceData = useMemo(() => {
    if (frames.length < 2) return { cumulative: [], total: 0 };
    const cumulative = [0];
    let total = 0;
    for (let i = 1; i < frames.length; i += 1) {
      total += frames[i - 1].position.distanceTo(frames[i].position);
      cumulative.push(total);
    }
    return { cumulative, total };
  }, [frames]);

  useEffect(() => {
    // Don't reset if animation has completed - keep it at the last keyframe
    if (doneRef.current) {
      if (frames.length > 0) {
        const lastFrame = frames[frames.length - 1];
        camera.position.copy(lastFrame.position);
        camera.quaternion.copy(lastFrame.quaternion);
      }
      return;
    }
    
    // Reset animation state for new keyframes
    startTimeRef.current = null;
    doneRef.current = false;
    if (frames.length > 0) {
      camera.position.copy(frames[0].position);
      camera.quaternion.copy(frames[0].quaternion);
    }
  }, [camera, frames]);

  useFrame(({ clock }) => {
    // Early exit if animation is done
    if (doneRef.current) {
      return;
    }
    
    if (!playing || frames.length < 2) {
      return;
    }
    
    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTimeRef.current - startDelay;
    if (elapsed < 0) return;

    const t = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(t);

    if (t >= 1) {
      // Ensure camera is at the last keyframe
      const lastFrame = frames[frames.length - 1];
      camera.position.copy(lastFrame.position);
      camera.quaternion.copy(lastFrame.quaternion);
      doneRef.current = true;
      if (onComplete) onComplete();
    } else {
      if (curve) {
        const point = curve.getPointAt(eased);
        camera.position.copy(point);
      }

      if (distanceData.total > 0) {
        const targetDistance = eased * distanceData.total;
        let index = 0;
        while (
          index < distanceData.cumulative.length - 2 &&
          distanceData.cumulative[index + 1] < targetDistance
        ) {
          index += 1;
        }
        const startDist = distanceData.cumulative[index];
        const endDist = distanceData.cumulative[index + 1];
        const segmentT =
          endDist > startDist
            ? (targetDistance - startDist) / (endDist - startDist)
            : 0;
        const from = frames[index];
        const to = frames[index + 1];
        camera.quaternion.slerpQuaternions(
          from.quaternion,
          to.quaternion,
          segmentT
        );
      }
    }
  });

  return null;
}
