export default defineEventHandler(() => {
  return {
    instanceId: process.env.INSTANCE_ID || 'unknown',
    pid: process.pid,
    port: process.env.PORT || process.env.NITRO_PORT || '3000',
    startedAt: (globalThis as any).__instanceStartedAt || null
  }
})

// Record start time once
;(globalThis as any).__instanceStartedAt = (globalThis as any).__instanceStartedAt || new Date().toISOString()
