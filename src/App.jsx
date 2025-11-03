import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei'
import { addToShopifyCart, postResize } from './postMessage'

// Prefilled values
const RAW = 'https://cdn.shopify.com/3d/models/cbf5c6a4b4ed515c/day6_full_arrow.glb'
const GLB_URL = 'https://cdn.shopify.com/3d/models/cbf5c6a4b4ed515c/day6_full_arrow.glb'
const DEFAULT_VARIANT_ID = '7408552673316'

// Palettes
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
  exploded: false,
}

function Swatch({ color, selected, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`swatch ${selected ? 'selected' : ''}`}
      style={{ background: color }}
    />
  )
}

function Sidebar({ cfg, setCfg, onExport, onShare, onAddToCart }) {
  const colorKeys = Object.keys(D6_COLORS)
  const wrapKeys = Object.keys(D6_WRAPS)

  useEffect(() => {
    const id = setInterval(postResize, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="sidebar">
      <div className="glass shadow-soft" style={{ padding: 16 }}>
        <div className="title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          Day Six — XD Builder <span className="badge">Live</span>
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          Premium, photo-real visualizer. Colors approximate in-browser lighting.
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div className="sub">Fletch Configuration</div>
        <div className="toggle">
          <button
            className={!cfg.fourFletch ? 'active' : ''}
            onClick={() => setCfg(c => ({ ...c, fourFletch: false }))}
          >3-Fletch</button>
          <button
            className={cfg.fourFletch ? 'active' : ''}
            onClick={() => setCfg(c => ({ ...c, fourFletch: true }))}
          >4-Fletch</button>
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div className="sub">Primary Vane</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
          {colorKeys.map(k => (
            <Swatch key={k} title={k}
              color={D6_COLORS[k]}
              selected={cfg.vaneColor === D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, vaneColor: D6_COLORS[k] }))}
            />
          ))}
        </div>

        <div className="sub" style={{ marginTop: 14 }}>Secondary Vane</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
          {colorKeys.map(k => (
            <Swatch key={k} title={k}
              color={D6_COLORS[k]}
              selected={cfg.secondaryVaneColor === D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, secondaryVaneColor: D6_COLORS[k] }))}
            />
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div className="sub">Nock</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
          {colorKeys.map(k => (
            <Swatch key={k} title={k}
              color={D6_COLORS[k]}
              selected={cfg.nockColor === D6_COLORS[k]}
              onClick={() => setCfg(c => ({ ...c, nockColor: D6_COLORS[k] }))}
            />
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div className="sub">Wrap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {Object.entries(D6_WRAPS).map(([k, v]) => (
            <Swatch key={k} title={k}
              color={v}
              selected={cfg.wrapColor === v}
              onClick={() => setCfg(c => ({ ...c, wrapColor: v }))}
            />
          ))}
        </div>
      </div>

      <div className="glass shadow-soft" style={{ padding: 16, display: 'flex', gap: 10 }}>
        <button className="btn" onClick={() => onExport(cfg)}>Export</button>
        <button className="btn" onClick={() => onShare(cfg)}>Share</button>
        <button className="btn green" onClick={() => onAddToCart(DEFAULT_VARIANT_ID, cfg)}>Add to Cart</button>
      </div>

      <div className="muted">Variant: {DEFAULT_VARIANT_ID}</div>
    </div>
  )
}

function ArrowModel({ cfg }) {
  const group = useRef()
  const { scene } = useGLTF(GLB_URL, true)

  const nodes = useMemo(() => {
    const m = {}
    scene.traverse(o => { if (o.name) m[o.name] = o })
    return m
  }, [scene])

  useEffect(() => {
    const v3 = nodes['Vanes_3']
    const v4 = nodes['Vanes_4']
    if (v3 && v4) { v3.visible = !cfg.fourFletch; v4.visible = cfg.fourFletch }

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
    if (nock) nock.traverse(o => o.isMesh && o.material && o.material.color && (o.material.color.set(cfg.nockColor), o.material.roughness = 0.2))

    const shaft = nodes['ShaftNode']
    if (shaft) shaft.traverse(o => o.isMesh && o.material && o.material.color && (o.material.color.set(cfg.wrapColor), o.material.roughness = 0.5))
  }, [cfg, nodes])

  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.25 })

  return <primitive ref={group} object={scene} />
}

function Stage({ children }) {
  return (
    <Canvas camera={{ position: [0.18, 0.22, 1.2], fov: 45 }} shadows dpr={[1, 1.75]}>
      <color attach="background" args={['#0b0b0b']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.2, 2.5, 2.2]} intensity={1.25} castShadow shadow-mapSize={1024} />
      <Environment preset="warehouse" />
      <ContactShadows position={[0, -0.12, 0]} opacity={0.35} scale={0.9} blur={2.6} far={0.7} />
      <Suspense fallback={<Html center style={{ color: '#9fe8a7' }}>Loading Arrow…</Html>}>{children}</Suspense>
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.06} maxDistance={3.0} minDistance={0.7} />
    </Canvas>
  )
}

export default function App() {
  const [cfg, setCfg] = useState(DEFAULT_CFG)

  const shareUrl = useMemo(() => {
    const u = new URL(window.location.href)
    u.searchParams.set('cfg', btoa(unescape(encodeURIComponent(JSON.stringify(cfg)))))
    return u.toString()
  }, [cfg])

  const onExport = (config) => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'day6_arrow_config.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const onShare = async () => {
    try { await navigator.clipboard.writeText(shareUrl); alert('Share link copied!') }
    catch { alert('Link: ' + shareUrl) }
  }

  const onAddToCart = (variantId, config) => addToShopifyCart(variantId, config)

  useEffect(() => { postResize() }, [])

  return (
    <>
      <div className="topbar">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:700">Day Six</span>
          <span className="muted">Arrow Visualizer</span>
        </div>
        <div className="muted">Drag to rotate · Scroll to zoom</div>
      </div>
      <div className="row">
        <div className="glass canvas-wrap shadow-soft">
          <Stage><ArrowModel cfg={cfg} /></Stage>
        </div>
        <div><Sidebar cfg={cfg} setCfg={setCfg} onExport={onExport} onShare={onShare} onAddToCart={onAddToCart}/></div>
      </div>
    </>
  )
}

useGLTF.preload(GLB_URL)
