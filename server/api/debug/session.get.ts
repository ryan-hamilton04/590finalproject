export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found'
    })
  }

  const session = await getUserSession(event)
  const headers = getHeaders(event)

  return {
    session: session,
    cookies: parseCookies(event),
    headers: {
      'user-agent': headers['user-agent'],
      'referer': headers['referer'],
      'host': headers['host']
    },
    url: getRequestURL(event).toString(),
    timestamp: new Date().toISOString()
  }
})
