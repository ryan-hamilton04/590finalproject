export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const session = await getUserSession(event)
  if (!(session && (session as any).user)) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const user = (session as any).user
  const roles: string[] = user.roles || []

  // Only users who have the teacher role can toggle into teacher mode
  if (!roles.includes('teacher')) {
    throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })
  }

  const requested: string | undefined = body?.mode
  const current = user.mode || 'student'
  let next = requested
  if (!next) {
    next = current === 'teacher' ? 'student' : 'teacher'
  }

  user.mode = next

  // Normalize roles to avoid duplicates (don't modify membership, just dedupe)
  if (Array.isArray(user.roles)) {
    const seen = new Set<string>()
    const normalized: string[] = []
    for (const r of user.roles) {
      const lc = String(r).toLowerCase()
      if (!seen.has(lc)) {
        seen.add(lc)
        normalized.push(r)
      }
    }
    user.roles = normalized
  }

  await setUserSession(event, {
    user: user,
    loggedInAt: (session as any).loggedInAt || Date.now()
  })

  return { success: true, mode: next }
})
