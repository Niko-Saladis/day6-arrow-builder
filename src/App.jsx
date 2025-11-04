import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html, useProgress } from '@react-three/drei'
import { addToShopifyCart, postResize } from './postMessage'

// ---- GLB through your Vercel proxy (works around CORS)
const RAW = 'https://cdn.shopify.com/3d/models/cbf5c6a4b4ed515c/day6_full_arrow.glb'
const GLB_URL = `/api/proxy-glb?url=${encodeURIComponent(RAW)}`
const DEFAULT_VARIANT_ID = '7408552673316'

// ---- Palettes
const D6_COLORS = {
  Black:'#000000', White:'#ffffff', Gray:'#9ca3af', Red:'#c91a1a', Blue:'#1976d2',
  'Bright Green':'#16c60c', 'Fire Orange':'#ff6a00', 'OD Green':'#556b2f',
  Purple:'#7c3aed', Teal:'#14b8a6', Sand:'#c2b280', Yellow:'#ffd600', 'Hot Pink':'#ff3fa4'
}
const D6_WRAPS = {
  'No Wrap':'#0b0b0b','Black/Blue Honeycomb':'#0b1f3a','Yellow/Gray Honeycomb':'#c0b200',
  'Blue/White Honeycomb':'#1f7ae0','White/Gray Honeycomb':'#d1d5db','Gray/White Topo':'#9ca3af',
  'Gray/Blue Topo':'#7896c9','White/Black Topo':'#9aa0a6','Reflective Topo':'#e5e7eb',
  'Black Duck Camo':'#2b2f29','Duck Camo':'#5a5f52','Duck Camo Reflective':'#9aa68f','White Reflective':'#f5f7fb'
}

const DEFAULT_CFG = {
  fourFletch: false,
  vaneColor: '#ffffff',
  secondaryVaneColor: '#9ca3af',
  nockColor: '#ffffff',
  wrapColor: '#0b0b0b',
  exploded: false
}

// ---- UI helpers
function Swatch({ color, selected, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`swatch ${selected ? 'selected' : ''}`}
      style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: color, cursor:'pointer' }}
    />
  )
}

function Sidebar({ cfg, setCfg, onAddToCart }) {
  const colorKeys = Object.keys(D6_COLORS)
  const wrapKeys  = Object.keys(D6_WRAPS)

  // keep iframe height happy when embedded in Shopify
  useEffect(() => {
    const id = setInterval(postResize, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="sidebar" style={{ position:'sticky', top:16, display:'flex', flexDirection:'column', gap:16 }}>
      <div className="glass shadow-soft" style={{ padding: 16 }}>
        <div style={{ fontWeight:700, display:'flex', gap:8, alignItems:'center' }}>
          Day Six — XD Builder <span style={{ fontSize:11, background:'#9fe8a7', color:'#0b2a19', padding:'3px 8px', borderRadius:999 }}>Live</span>
        </div>
        <div style={{ color:'#a9b1b8', marginTop:6, fontSize:12 }}>Photo-real viewer. Colors approximate in-browser lighting.</div>
      </div>

      <div className="panel" style={{ padding:16, border:'1px solid rgba(255,255,255,.08)', borderRadius:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:'#cbd5dc' }}>Fletch Configuration</div>
        <div style={{ display:'inline-flex', padding:6, borderRadius:12, gap:6, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)' }}>
          <button
            style={{ padding:'8px 12px', borderRadius:10, border:0, background: !cfg.fourFletch ? 'rgba(255,255,255,.12)':'transparent', color:'#e7ecef', cursor:'pointer' }}
            onClick={() => setCfg(c => ({ ...c, fourFletch:false }))}>3-Fletch</button>
          <button
            style={{ padding:'8px 12px', borderRadius:10, border:0, background: cfg.fourFletch ? 'rgba(255,255,255,.12)':'transparent', color:'#e7ecef', cursor:'pointer' }}
            onClick={() => setCfg(c => ({ ...c, fourFletch:true }))}>4-Fletch</button>
        </div>
      </div>

      <div className="panel" style={{ padding:16, border:'1px solid rgba(255,255,255,.08)', borderRadius:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:'#cbd5dc' }}>Primary Vane</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:8 }}>
          {colorKeys.map(k => (
            <Swatch key={k} title={k} color={D6_COLORS[k]} selected={cfg.vaneColor===D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, vaneColor: D6_COLORS[k] }))}/>
          ))}
        </div>

        <div style={{ fontWeight:600, fontSize:13, margin:'14px 0 8px', color:'#cbd5dc' }}>Secondary Vane</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:8 }}>
          {colorKeys.map(k => (
            <Swatch key={k} title={k} color={D6_COLORS[k]} selected={cfg.secondaryVaneColor===D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, secondaryVaneColor: D6_COLORS[k] }))}/>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding:16, border:'1px solid rgba(255,255,255,.08)', borderRadius:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:'#cbd5dc' }}>Nock</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:8 }}>
          {Object.keys(D6_COLORS).map(k => (
            <Swatch key={k} title={k} color={D6_COLORS[k]} selected={cfg.nockColor===D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, nockColor: D6_COLORS[k] }))}/>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding:16, border:'1px solid rgba(255,255,255,.08)', borderRadius:16 }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:'#cbd5dc' }}>Wrap</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
          {Object.entries(D6_WRAPS).map(([k,v]) => (
            <Swatch key={k} title={k} color={v} selected={cfg.wrapColor===v}
              onClick={() => setCfg(c => ({ ...c, wrapColor: v }))}/>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn" style={{ padding:'12px 14px', borderRadius:14, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'#e7ecef', cursor:'pointer' }}
          onClick={() => onAddToCart(DEFAULT_VARIANT_ID, cfg)}>Add to Cart</button>
      </div>

      <div style={{ color:'#a9b1b8', fontSize:12 }}>Variant: {DEFAULT_VARIANT_ID}</div>
    </div>
  )
}

// ---- Loader overlay
function LoaderOverlay() {
  const { active, progress, errors, item } = useProgress()
  if (!active && !errors?.length) return null
  return (
    <Html center style={{ color: errors?.length ? '#ffb3b3' : '#9fe8a7', fontFamily:'system-ui, Arial' }}>
      {errors?.length ? `Load error: ${String(errors[0]?.message || errors[0])}` :
        `Loading… ${Math.round(progress)}%${item ? ` (${item.split('/').pop()})` : ''}`}
    </Html>
  )
}

// ---- Fit camera to model bounds
function useFitCamera(objectRef) {
  const { camera } = useThree()
  useEffect(() => {
    const obj = objectRef.current
    if (!obj) return
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const dist = Math.abs(maxDim / (2 * Math.tan((camera.fov * Math.PI/180) / 2))) * 1.6
    camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, dist)))
    camera.near = dist / 100
    camera.far = dist * 100
    camera.lookAt(center)
    camera.updateProjectionMatrix()
  }, [objectRef, camera])
}

// ---- Model
function ArrowModel({ cfg }) {
  const group = useRef()
  const { scene } = useGLTF(GLB_URL, { draco:true, meshopt:true, ktx2:true })
  useFitCamera(group)
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.18 })

  // Map node names (adjust if your GLB uses different ones)
  const nodes = useMemo(() => {
    const m = {}; scene.traverse(o => { if (o.name) m[o.name] = o }); return m
  }, [scene])

  useEffect(() => {
    // 3-vs-4 fletch
    const v3 = nodes['Vanes_3'], v4 = nodes['Vanes_4']
    if (v3 && v4) { v3.visible = !cfg.fourFletch; v4.visible = cfg.fourFletch }

    // recolor groups (primary/secondary alternating)
    const recolor = (grp, p, s) => {
      if (!grp) return
      let i = 0
      grp.traverse(o => {
        if (o.isMesh && o.material && o.material.color) {
          const useP = (i % 2 === 0)
          o.material.color.set(useP ? p : s)
          o.material.roughness = 0.35
          o.material.metalness = 0.02
          o.material.needsUpdate = true
          i++
        }
      })
    }
    recolor(nodes['Vanes_3'], cfg.vaneColor, cfg.secondaryVaneColor)
    recolor(nodes['Vanes_4'], cfg.vaneColor, cfg.secondaryVaneColor)

    const nock = nodes['NockNode']
    if (nock) nock.traverse(o => o.isMesh && o.material?.color && (o.material.color.set(cfg.nockColor), o.material.roughness = 0.2))

    const shaft = nodes['ShaftNode']
    if (shaft) shaft.traverse(o => o.isMesh && o.material?.color && (o.material.color.set(cfg.wrapColor), o.material.roughness = 0.5))
  }, [cfg, nodes])

  return <primitive ref={group} object={scene} />
}

// ---- Stage
function Stage({ children }) {
  return (
    <Canvas camera={{ position: [0.2, 0.22, 1.6], fov: 45 }} shadows dpr={[1, 1.75]}>
      <color attach="background" args={['#0b0b0b']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.2, 2.5, 2.2]} intensity={1.25} castShadow shadow-mapSize={1024} />
      <Environment preset="warehouse" />
      <ContactShadows position={[0, -0.12, 0]} opacity={0.35} scale={0.9} blur={2.6} far={0.7} />
      <Suspense fallback={<Html center style={{ color: '#9fe8a7' }}>Loading…</Html>}>
        {children}
      </Suspense>
      <LoaderOverlay />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.06} maxDistance={5.0} minDistance={0.5} />
    </Canvas>
  )
}

export default function App() {
  const [cfg, setCfg] = useState(DEFAULT_CFG)

  useEffect(() => { postResize() }, [])

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:22 }}>
        <div className="glass shadow-soft" style={{ borderRadius:20, overflow:'hidden', height:'clamp(60vh, 80vh, 86vh)' }}>
          <Stage><ArrowModel cfg={cfg} /></Stage>
        </div>
        <Sidebar cfg={cfg} setCfg={setCfg} onAddToCart={(id, c) => addToShopifyCart(id, c)} />
      </div>
    </div>
  )
}

useGLTF.preload(GLB_URL, { draco:true, meshopt:true, ktx2:true })
