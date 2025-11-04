// src/App.jsx
import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html, useProgress } from '@react-three/drei'

// 1) Start with a known-good public GLB to confirm model loading works end-to-end.
//    After you see the Duck, go to Step 2 and switch GLB_URL to your Day Six proxy URL.
const GLB_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'

function LoaderOverlay() {
  const { active, progress, errors, item } = useProgress()
  if (!active && !errors?.length) return null
  return (
    <Html center style={{ color: errors?.length ? '#ffb3b3' : '#9fe8a7', fontFamily: 'system-ui, Arial' }}>
      {errors?.length
        ? `Load error: ${String(errors[0]?.message || errors[0])}`
        : `Loading… ${Math.round(progress)}%${item ? ` (${item.split('/').pop()})` : ''}`}
    </Html>
  )
}

function Model() {
  const group = useRef()
  const { scene } = useGLTF(GLB_URL, true)
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.25 })
  return <primitive ref={group} object={scene} />
}

// Minimal UI shell
export default function App() {
  return (
    <div style={{ height: '80vh', padding: 20, background: '#0b0b0b' }}>
      <div style={{ color: '#9fe8a7', marginBottom: 8, fontFamily: 'system-ui, Arial' }}>
        Premium scene • Duck test → then swap to Day Six GLB
      </div>
      <Canvas camera={{ position: [0.2, 0.22, 1.2], fov: 45 }} shadows dpr={[1, 1.75]}>
        <color attach="background" args={['#0b0b0b']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2.2, 2.5, 2.2]} intensity={1.25} castShadow shadow-mapSize={1024} />
        <Environment preset="warehouse" />
        <ContactShadows position={[0, -0.12, 0]} opacity={0.35} scale={0.9} blur={2.6} far={0.7} />
        <Suspense fallback={<Html center style={{ color: '#9fe8a7' }}>Loading…</Html>}>
          <Model />
        </Suspense>
        <LoaderOverlay />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.06} maxDistance={3.0} minDistance={0.7} />
      </Canvas>
    </div>
  )
}
