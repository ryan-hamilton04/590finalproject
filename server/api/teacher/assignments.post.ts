import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherId = (session.user as any)?.email

  if (!teacherId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  // require teacher role + teacher mode
  const u = (session.user as any) || {}
  const roles: string[] = u.roles || []
  const mode: string = u.mode || 'student'
  if (!(roles.includes('teacher') && mode === 'teacher')) {
    throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })
  }

  const body = await readBody<{ title: string; description?: string; dueDate?: string; classId?: string }>(event)
  if (!body || !body.title) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid assignment data' })
  }

  try {
    const { assignments } = await getCollections()

    const now = new Date().toISOString()

    const doc = {
      _id: `${Date.now()}`,
      title: body.title,
      description: body.description || '',
      dueDate: body.dueDate,
      classId: body.classId,
      teacherId,
      createdAt: now
    }

    await assignments.insertOne(doc)

    return { status: 'ok', assignmentId: doc._id }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create assignment' })
  }
})
