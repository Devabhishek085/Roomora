import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface HeroSceneProps {
  locationName?: string;
  isSearching?: boolean;
}

// 3D Glowing Location Pin that reacts when location changes
function LocationPin({ isSearching }: { isSearching?: boolean }) {
  const pinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    setPulse(1);
    const timeout = setTimeout(() => setPulse(0), 1200);
    return () => clearTimeout(timeout);
  }, [isSearching]);

  useFrame((state, delta) => {
    if (pinRef.current) {
      // Floating hover bobbing
      pinRef.current.position.y = 3.6 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25;
      pinRef.current.rotation.y += delta * 1.5;
    }
    if (ringRef.current) {
      const scale = 1 + (Math.sin(state.clock.elapsedTime * 3) + 1) * 0.3 + pulse * 0.8;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Ground marker glow ring */}
      <mesh ref={ringRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.75, 32]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating 3D Pin */}
      <group ref={pinRef}>
        {/* Head */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial
            color="#0d9488"
            emissive="#14b8a6"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        {/* Pin inner core */}
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Cone tip */}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.42, 0.8, 24]} />
          <meshStandardMaterial
            color="#0f766e"
            emissive="#14b8a6"
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// Low-poly Campus Buildings & City Block
function IsometricCampus({ isSearching }: { isSearching?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Buildings data with deterministic aesthetics
  const buildings = useMemo(() => [
    { x: -2.2, z: -1.8, w: 1.4, h: 2.8, d: 1.4, color: '#334155', glowColor: '#38bdf8' },
    { x: 2.2, z: -1.8, w: 1.6, h: 3.4, d: 1.5, color: '#1e293b', glowColor: '#2dd4bf' },
    { x: -2.4, z: 1.8, w: 1.5, h: 2.2, d: 1.3, color: '#1e293b', glowColor: '#f59e0b' },
    { x: 2.3, z: 1.8, w: 1.4, h: 2.6, d: 1.4, color: '#334155', glowColor: '#38bdf8' },
    // Center background campus tower
    { x: 0, z: -2.6, w: 2.0, h: 4.2, d: 1.8, color: '#0f172a', glowColor: '#14b8a6' },
    // Secondary student residences
    { x: -3.8, z: 0, w: 1.2, h: 1.9, d: 1.6, color: '#475569', glowColor: '#facc15' },
    { x: 3.8, z: 0, w: 1.2, h: 2.0, d: 1.6, color: '#475569', glowColor: '#2dd4bf' },
  ], []);

  // Trees data
  const trees = useMemo(() => [
    { x: -1.0, z: 1.5, s: 0.9 },
    { x: 1.0, z: 1.5, s: 0.85 },
    { x: -1.2, z: -0.8, s: 0.75 },
    { x: 1.2, z: -0.8, s: 0.8 },
    { x: -3.6, z: -2.0, s: 0.7 },
    { x: 3.6, z: -2.0, s: 0.75 },
    { x: 0, z: 2.4, s: 0.95 },
  ], []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle continuous rotation
      groupRef.current.rotation.y += delta * 0.12;
      // Gentle interactive mouse parallax
      const targetRotX = (state.pointer.y * Math.PI) / 22;
      const targetRotZ = -(state.pointer.x * Math.PI) / 26;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      {/* Floating Island Base / Pedestal */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[5.2, 5.0, 0.8, 36]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      {/* Pedestal Top Lawn / Pavement */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.1, 36]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.8}
        />
      </mesh>

      {/* Pathways / Roads with neon crosswalks */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 9.6]} />
        <meshStandardMaterial color="#0b1120" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.6, 9.6]} />
        <meshStandardMaterial color="#0b1120" roughness={0.9} />
      </mesh>

      {/* Glowing road center dashed line */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 8.8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>

      {/* Campus Buildings */}
      {buildings.map((b, idx) => (
        <group key={idx} position={[b.x, b.h / 2 + 0.05, b.z]}>
          {/* Main structure */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.color}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          {/* Roof detail */}
          <mesh position={[0, b.h / 2 + 0.1, 0]}>
            <boxGeometry args={[b.w * 0.85, 0.2, b.d * 0.85]} />
            <meshStandardMaterial color="#090d16" roughness={0.5} />
          </mesh>
          {/* Glowing Windows */}
          <mesh position={[0, 0, b.d / 2 + 0.02]}>
            <planeGeometry args={[b.w * 0.7, b.h * 0.6]} />
            <meshBasicMaterial
              color={b.glowColor}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[0, 0, -(b.d / 2 + 0.02)]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[b.w * 0.7, b.h * 0.6]} />
            <meshBasicMaterial
              color={b.glowColor}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}

      {/* Low-poly Campus Trees */}
      {trees.map((t, idx) => (
        <group key={`tree-${idx}`} position={[t.x, 0, t.z]} scale={[t.s, t.s, t.s]}>
          {/* Trunk */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Leaves Foliage */}
          <mesh position={[0, 0.9, 0]}>
            <coneGeometry args={[0.45, 0.9, 8]} />
            <meshStandardMaterial color="#059669" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <coneGeometry args={[0.35, 0.7, 8]} />
            <meshStandardMaterial color="#10b981" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Floating 3D Location Marker in Center Plaza */}
      <LocationPin isSearching={isSearching} />
    </group>
  );
}

export const HeroScene: React.FC<HeroSceneProps> = ({ isSearching }) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    // Graceful static fallback
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl border border-slate-800 text-center">
        <div>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-teal-500/20 flex items-center justify-center border border-teal-500/40">
            <span className="text-3xl">🏛️</span>
          </div>
          <h4 className="text-xl font-bold text-white mb-2">Student & Co-Living Neighborhood</h4>
          <p className="text-sm text-slate-300 max-w-sm">Interactive map and roommate matching are 100% active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px] sm:h-[520px] lg:h-[580px] relative select-none">
      <Canvas
        camera={{ position: [10, 8, 10], fov: 38 }}
        dpr={[1, 1.75]} // Capped for smooth 60fps on laptops
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[12, 18, 10]} intensity={1.8} castShadow />
        <pointLight position={[-8, 6, -8]} intensity={0.9} color="#38bdf8" />
        <pointLight position={[0, 4, 0]} intensity={2.0} color="#14b8a6" distance={8} />

        <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.4}>
          <IsometricCampus isSearching={isSearching} />
        </Float>

        {/* Ambient floating magic dust */}
        <Sparkles
          count={45}
          scale={[10, 8, 10]}
          size={3.2}
          speed={0.4}
          opacity={0.6}
          color="#2dd4bf"
        />
      </Canvas>

      {/* Floating 3D Badge Overlay */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-teal-500/30 text-xs text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Interactive 3D Neighborhood Block</span>
        </div>
      </div>
    </div>
  );
};
