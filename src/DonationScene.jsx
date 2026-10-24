import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, Sparkles } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

function Earth() {
  const group = useRef()
  const core = useRef()
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.08
    }
    if (core.current) core.current.rotation.y -= delta * 0.08
  })
  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.3}>
        <mesh ref={core}>
          <sphereGeometry args={[1.48, 64, 64]} />
          <meshStandardMaterial color="#164e78" roughness={0.78} metalness={0.12} />
        </mesh>
        <mesh scale={1.012}>
          <sphereGeometry args={[1.48, 48, 48]} />
          <meshBasicMaterial color="#48c7ff" wireframe transparent opacity={0.18} />
        </mesh>
        <mesh scale={1.055}>
          <sphereGeometry args={[1.48, 48, 48]} />
          <meshBasicMaterial color="#4aa8ff" side={THREE.BackSide} transparent opacity={0.08} />
        </mesh>
        <mesh rotation={[0.35, 0.2, -0.3]} scale={[1.9, 1.9, 0.018]}>
          <torusGeometry args={[1.2, 0.006, 8, 180]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[1.18, 0.55, 0.25]} scale={[1.72, 1.72, 0.018]}>
          <torusGeometry args={[1.2, 0.004, 8, 180]} />
          <meshBasicMaterial color="#8b9dff" transparent opacity={0.36} />
        </mesh>
      </Float>
    </group>
  )
}

export default function DonationScene() {
  return (
    <div className="scene-wrap" aria-label="Animated 3D planet with stars">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        fallback={<div className="scene-fallback" />}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.75} />
          <pointLight position={[3, 2, 4]} intensity={32} color="#80d7ff" />
          <pointLight position={[-3, -1, 1]} intensity={14} color="#7968ff" />
          <Stars radius={75} depth={45} count={1100} factor={2.2} saturation={0.2} fade speed={0.5} />
          <Sparkles count={70} scale={5.6} size={2.2} speed={0.22} opacity={0.55} color="#8bdcff" />
          <Earth />
        </Suspense>
      </Canvas>
      <div className="scene-glow" />
    </div>
  )
}
