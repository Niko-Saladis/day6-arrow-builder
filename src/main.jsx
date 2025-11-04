// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx' // MUST match the filename exactly
window.addEventListener('error', e => console.log('Global error:', e?.message))
console.log('Main mounted')
createRoot(document.getElementById('root')).render(<App />)
