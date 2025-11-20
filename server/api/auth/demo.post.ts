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

  await setUserSession(event, {
    user: {
      id: 'cicd-test-123',
      name: 'CI/CD Test',
      email: 'cicd-test@smoothiestand.local',
      avatar: 'https://ui-avatars.com/api/?name=CI%2FCD+Test&background=0ea5e9&color=fff',
      provider: 'demo',
      roles: ['user', 'operator']
    },
    loggedInAt: Date.now()
  })

  return {
    success: true,
    data: {
      message: 'Demo login successful'
    }
  }
})
