export default defineEventHandler(async (event) => {
  // Read password directly from environment at runtime
  const cicdPassword = process.env.NUXT_CICD_TEST_PASSWORD

  // If no password is configured, disable CI/CD test login
  if (!cicdPassword) {
    throw createError({
      statusCode: 403,
      statusMessage: 'CI/CD test login is not enabled'
    })
  }

  // Get password from request body
  const body = await readBody(event)
  const providedPassword = body?.password

  // Verify password
  if (providedPassword !== cicdPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  const demoRoles = ['student', 'teacher']
  const seen = new Set<string>()
  const normalizedRoles: string[] = []
  for (const r of demoRoles) {
    const lc = String(r).toLowerCase()
    if (!seen.has(lc)) {
      seen.add(lc)
      normalizedRoles.push(r)
    }
  }

  await setUserSession(event, {
    user: {
      id: 'cicd-test-123',
      name: 'CI/CD Test',
      email: 'cicd-test@smoothiestand.local',
      avatar: 'https://ui-avatars.com/api/?name=CI%2FCD+Test&background=0ea5e9&color=fff',
      provider: 'demo',
      roles: normalizedRoles,
      mode: 'teacher'
    },
    loggedInAt: Date.now()
  })

  // Persist demo user to DB for tests / CI visibility
  try {
    const { getCollections } = await import('../../utils/mongo')
    const { students, teachers } = await getCollections()
    const now = new Date().toISOString()
    const email = 'cicd-test@smoothiestand.local'
    await students.updateOne({ email }, { $set: { name: 'CI/CD Test', email, avatar: 'https://ui-avatars.com/api/?name=CI%2FCD+Test&background=0ea5e9&color=fff', provider: 'demo', roles: normalizedRoles, mode: 'teacher', updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true })
    if (normalizedRoles.includes('teacher')) {
      await teachers.updateOne({ email }, { $set: { name: 'CI/CD Test', email, avatar: 'https://ui-avatars.com/api/?name=CI%2FCD+Test&background=0ea5e9&color=fff', provider: 'demo', roles: normalizedRoles, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true })
    }
  } catch (dbErr) {
    console.warn('Failed to persist demo user to DB:', dbErr)
  }

  return {
    success: true,
    data: {
      message: 'Demo login successful'
    }
  }
})
