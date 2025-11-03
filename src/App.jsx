// src/App.jsx
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function SpinningBox() {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.8 })
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial />
    </mesh>
  )
}

export default function App() {
  return (
    <div style={{ height: '80vh', padding: 20, background: '#0b0b0b' }}>
      <div style={{ color: '#9fe8a7', marginBottom: 8, fontFamily: 'system-ui, Arial' }}>
        Safe Mode • Canvas test (should show a spinning cube)
      </div>
      <Canvas camera={{ position: [1.5, 1.2, 1.5], fov: 50 }}>
        <color attach="background" args={['#0b0b0b']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={1.2} />
        <SpinningBox />
      </Canvas>
    </div>
  )
}
