export default defineEventHandler(() => {
  return {
    status: 'ok',
    pid: process.pid,
    port: process.env.PORT || process.env.NITRO_PORT || '3000',
    instanceId: process.env.INSTANCE_ID || null,
    ts: Date.now()
  }
})