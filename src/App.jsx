import React, { useRef, useLayoutEffect, Suspense, useState } from "react";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
// import { Perf } from "r3f-perf";
import { OrbitControls, useGLTF, useCursor } from "@react-three/drei";
import NightSky from "./sky"; 
import CameraSetup from "./cameraSetup";
import Raymarching from "./Raymarching.jsx";
import FogShader from "./fogShader.jsx";
import CameraAnim from "./cameraAnim.jsx";
import { Environment } from "@react-three/drei";
import {TrackballControls} from "@react-three/drei" 
import { Box3, Vector3 } from "three";  

const LOGO_DETAILS = {
  BCR_logo: {
    title: "BCR",
    meta: ["Created: 2024", "Origin: Sydney", "Type: Finance"],
    description: "Add BCR project description here.",
    tech: ["Python", "PyTorch", "Metatrader 5", "TradingView"],
    skills: ["Client Communication", "System Thinking"],
  },
  IBM_logo: {
    title: "IBM",
    meta: ["Created: 2025", "Origin: Global", "Type: Enterprise"],
    description: "Add IBM project description here.",
    tech: ["Ollama", "Watsonx.AI", "Langchain", "Kubernetes", "IBM Cloud", "GCP"],
    skills: ["Architecture Design", "Problem Solving"],
  },
  HITC_logo: {
    title: "Head In The Clouds (v 1.0)",
    meta: ["Created: 2026", "Origin: BayCity", "Status: Under Active Construction"],
    description:
      "A floating cyberpunk city used as my own living portfolio. Built because I wanted to showcase my skills in a memorable way. Based upto a custom 3D world I created, inspired by baycity from my favourite show Altered Carbon. Transformed into a webviewable version using React Three Fibre",
    tech: ["React Three Fiber", "Blender", "JavaScript", "Three.js", "Vite"],
    skills: ["3D Scene Composition", "Shader Thinking", "UX in 3D Space"],
  },
  Mindsafari_logo: {
    title: "MindSafari",
    meta: ["Created: 2025", "Origin: Sydney", "Type: Startup"],
    description: "www.mindsafari.com.au",
    tech: ["MERN", "GCP", "Open AI API", "Github"],
    skills: ["Product Design", "User Research"],
  },
 Humano_01Business_01_30K_001002: {
    title: "Veer",
    meta: ["Role: Observer", "Status: Active"],
    description: "The character representing me inside BayCity.",
    tech: ["Blender", "Rigged Mesh"],
    skills: ["Presence", "Perspective"],
  },

};


const LOGO_HITBOX_TARGETS = [
  { key: "BCR_logo" },
  { key: "IBM_logo" },
  { key: "HITC_logo" },
  { key: "Mindsafari_logo" },
  { key: "Humano_01Business_01_30K_001002" },
];

function LogoHitbox({ size, position, label, onClick }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <mesh
      position={position}
      name={`hitbox-${label}`}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.(label);
      }}
    >
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// Model loader component
function Model({ url, onLoad, onLogoClick, hitboxTargets = LOGO_HITBOX_TARGETS }) {
  const gltf = useGLTF(url);
  const scene = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);  
  const ref = useRef();
  const [hitboxes, setHitboxes] = useState([]);

  useLayoutEffect(() => {
    
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);
  
    // 1) bounds BEFORE scaling
    const preBox = new Box3().setFromObject(scene);
    const preSize = new Vector3();
    preBox.getSize(preSize);
  
    // 2) scale to fit 10 units
    const maxSize = Math.max(preSize.x, preSize.y, preSize.z) || 1;
    const scale = 10 / maxSize;
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);
  
    // 3) bounds AFTER scaling
    const postBox = new Box3().setFromObject(scene);
    const postCenter = new Vector3();
    postBox.getCenter(postCenter);
  
    // 4) center AFTER scaling
    scene.position.sub(postCenter);
    scene.updateMatrixWorld(true);
  
    console.log("SCALED SIZE:", new Box3().setFromObject(scene).getSize(new Vector3()).toArray());
  

    const hitsByKey = new Map();
    const lowerTargets = hitboxTargets.map(target => ({
      ...target,
      keyLower: target.key.toLowerCase(),
    })); 

    scene.traverse(obj => {
      if (obj.isMesh && obj.name?.toLowerCase().includes("humano")) {
        console.log("HUMANO RUNTIME NAME:", obj.name);
      
      }
      
      
      
      if (!obj.isMesh || !obj.name) return;
      const target = lowerTargets.find(t => obj.name.toLowerCase().includes(t.keyLower));
      if (!target) return;

      const objBox = new Box3().setFromObject(obj);
      if (objBox.isEmpty()) return;

      if (!hitsByKey.has(target.key)) {
        hitsByKey.set(target.key, objBox.clone());
      } else {
        hitsByKey.get(target.key).union(objBox);
      }
    });

    const hits = Array.from(hitsByKey.entries()).map(([key, box3]) => {
      const objSize = new Vector3();
      const objCenter = new Vector3();
      box3.getSize(objSize);
      box3.getCenter(objCenter);
      
      if (key.toLowerCase().includes("humano")) {
        objSize.multiplyScalar(0.7);
        objCenter.x -= objSize.x * 0.1
        objCenter.y += objSize.y * 0.2
      } else {
        objSize.multiplyScalar(1.2);
      }
      
      return { label: key, size: objSize, center: objCenter };
    });

    if (hits.length === 0) {
      console.warn("No logo meshes matched hitbox targets:", hitboxTargets);
    }

    setHitboxes(hits);
    if (onLoad) onLoad();

  }, [scene, onLoad, hitboxTargets]);

  return (
    <group>
      <primitive ref={ref} object={scene} />
      {hitboxes.map(hitbox => (
        <LogoHitbox
          key={hitbox.label}
          label={hitbox.label}
          size={hitbox.size}
          position={hitbox.center}
          onClick={onLogoClick}
        />
      ))}
    </group>
  );
}


// Main App component
export default function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraAnimDone, setCameraAnimDone] = useState(false);
  const [animReady, setAnimReady] = useState(false);
  const [activeLogo, setActiveLogo] = useState(null);

  React.useEffect(() => {
    if (!modelLoaded) return;
    setAnimReady(true);
  }, [modelLoaded]);
  const handleLogoClick = (label) => {
    const details = LOGO_DETAILS[label];
    if (!details) return;
    setActiveLogo({ key: label, ...details });
  };
  return (
    <div className="app-root">
      
    
      <Canvas camera={{ fov: 45, near: 0.1, far: 1000 }} dpr={[1.5, 2]} >
      
      {/* <color attach="background" args={["black"]} /> */}
      {/* Set initial camera position immediately, but only play animation after model loads */}
      {!cameraAnimDone && (
        <CameraAnim
          keyframes={[
            { position: [-1.3, 1.03, -4.65], rotation: [-1.55, 0.01, 0.21] },
            { position: [-1.25, 0.98, -4.37], rotation: [-1.27, 0.06, 0.18] },
            { position: [-1.19, 0.8, -4.03], rotation: [-0.91, 0.11, 0.15] },
            { position: [-1.15, 0.58, -3.82], rotation: [-0.62, 0.15, 0.1] },
            { position: [-1.12, 0.26, -3.68], rotation: [-0.29, 0.18, 0.05] },
            { position: [-1.09, 0.11, -3.65], rotation: [-0.14, 0.2, 0.03] },
            { position: [-1.09, -0, -3.64], rotation: [-0.03, 0.21, 0.01] },
          ]}
          playing={animReady && !cameraAnimDone}
          onComplete={() => setCameraAnimDone(true)}
        />
      )}

      <color attach="background" args={["#0b0b0b"]} />
      <ambientLight intensity={3}/> 
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#aabbff"/> 
      {/* <CameraSetup /> */}
      
      {/* Load model */}
      <Suspense fallback={null}>
        <Model
          url="/model.glb"
          onLoad={() => setModelLoaded(true)}
          onLogoClick={handleLogoClick}
        />
      </Suspense>
     <NightSky /> 
     {/* <TrackballControls />  */}
     {/* <OrbitControls /> */}

      {/*<gridHelper args={[100, 100]} />*/}
      {/*<Perf position="top-left" />*/}
      
     </Canvas>
  
    <div className="ui-layer">
      {activeLogo && (
        <div
          className="logo-modal-backdrop"
          onClick={() => setActiveLogo(null)}
        >
          <div className="logo-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{activeLogo.title}</h2>
            <div className="logo-meta">
              {activeLogo.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div>
              <div className="logo-section-title">Project Description</div>
              <p>{activeLogo.description}</p>
            </div>

            <div>
              <div className="logo-section-title">Tech Stack</div>
              <div className="logo-tags">
                {activeLogo.tech.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="logo-section-title">Skills Learnt</div>
              <div className="logo-tags">
                {activeLogo.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="logo-modal-close"
              onClick={() => setActiveLogo(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}


// Add R3F perf to allow for performance monitoring and optimization 
