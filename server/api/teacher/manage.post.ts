import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherEmail = (session.user as any)?.email as string | undefined
  const providerId = (session.user as any)?.id?.toString() as string | undefined
  if (!teacherEmail && !providerId) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const roles = (session.user as any)?.roles || []
  const mode = (session.user as any)?.mode
  if (!(roles.includes('teacher') && mode === 'teacher')) throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })

  const body = await readBody<{ email?: string; name?: string }>(event)
  if (!body.email || !body.name) throw createError({ statusCode: 400, statusMessage: 'email and name required' })

  try {
    const { students } = await getCollections()
    const now = new Date()
    await students.updateOne(
      { email: body.email },
      {
        $set: {
          email: body.email,
          name: body.name,
          roles: ['student'],
          teacherId: teacherEmail, // always store email key
          ...(providerId ? { teacherProviderId: providerId } : {}),
          provider: 'manual',
          updatedAt: now.toISOString()
        },
        $setOnInsert: { createdAt: now.toISOString() }
      },
      { upsert: true }
    )
    return { status: 'ok' }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to add student' })
  }
})