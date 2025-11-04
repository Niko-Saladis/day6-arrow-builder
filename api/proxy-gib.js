// api/proxy-glb.js
export default async function handler(req, res) {
  try {
    const url = req.query.url
    if (!url) return res.status(400).send('Missing ?url=')
    const r = await fetch(url)
    if (!r.ok) return res.status(r.status).send(`Upstream error: ${r.statusText}`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream')
    const buf = Buffer.from(await r.arrayBuffer())
    res.status(200).send(buf)
  } catch (e) {
    res.status(500).send(`Proxy error: ${e.message}`)
  }
}
