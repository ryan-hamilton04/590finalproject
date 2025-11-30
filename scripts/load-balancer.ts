/*
 Simple HTTP load balancer for local development.
 Starts a proxy on LB_PORT (default 8131) and distributes incoming requests
 across a list of target backend instances (Nuxt server builds) using round-robin.

 Usage:
 1. Build the app: npm run build
 2. Start multiple backend instances on different ports:
      NUXT_PORT=8132 node .output/server/index.mjs &
      NUXT_PORT=8133 node .output/server/index.mjs &
 3. Run the balancer:
      tsx scripts/load-balancer.ts
 4. Hit http://localhost:8131/ normally.

 Health determination:
 - Attempts GET /api/health (fallback to /) every second.
 - Only routes to targets marked available.

 You can adjust TARGET_PORTS or LB_PORT via env vars:
   LB_PORT=9000 TARGET_PORTS=8132,8133 tsx scripts/load-balancer.ts
*/
import http from 'http'
// http-proxy is CommonJS; import default and access createProxyServer off it
// @ts-ignore - types may not be installed for http-proxy
import httpProxyModule from 'http-proxy'

interface Target {
  url: string
  available: boolean
}

const LB_PORT = parseInt(process.env.LB_PORT || '8131', 10)
const TARGET_HOST = process.env.TARGET_HOST || 'localhost'
const targetPorts = (process.env.TARGET_PORTS || '8132,8133')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean)
const targets: Target[] = targetPorts.map(p => ({ url: `http://${TARGET_HOST}:${p}`, available: false }))

// Support both ESM/CJS interop shapes
const httpProxy: any = (httpProxyModule as any)?.default ?? (httpProxyModule as any)
const proxyServer = httpProxy.createProxyServer({ xfwd: true })
let rrIndex = 0

function nextTarget(active: Target[]): Target {
  const t = active[rrIndex % active.length]
  rrIndex = (rrIndex + 1) % active.length
  return t
}

async function checkTarget(t: Target) {
  const healthPaths = ['/api/health', '/']
  for (const path of healthPaths) {
    try {
      const controller = new AbortController()
      const to = setTimeout(() => controller.abort(), 1000)
      const res = await fetch(t.url + path, { signal: controller.signal })
      clearTimeout(to)
      if (res.status < 400) {
        if (!t.available) console.log(`[UP] ${t.url}`)
        t.available = true
        return
      }
    } catch (_) {
      /* ignore */
    }
  }
  if (t.available) console.log(`[DOWN] ${t.url}`)
  t.available = false
}

function runHealthChecks() {
  targets.forEach(t => { void checkTarget(t) })
}
// run once immediately, then every second
runHealthChecks()
setInterval(runHealthChecks, 1000)

http.createServer((req, res) => {
  const active = targets.filter(t => t.available)
  if (active.length === 0) {
    res.writeHead(503, { 'Content-Type': 'text/plain' })
    res.end('No backend targets available')
    return
  }
  const chosen = nextTarget(active)
  // Simple per-request log for visibility
  console.log(`${req.method} ${req.url} -> ${chosen.url}`)
  proxyServer.web(req, res, { target: chosen.url }, (err: unknown) => {
    console.error('Proxy error:', err)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
      res.end('Bad gateway')
    }
  })
}).listen(LB_PORT, () => {
  console.log(`Load balancer listening on http://localhost:${LB_PORT}`)
  console.log(`Targets: ${targets.map(t => t.url).join(', ')}`)
})
