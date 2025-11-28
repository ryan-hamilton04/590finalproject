import { getCollections } from '../../../../utils/mongo'

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

  const assignmentId = getRouterParam(event, 'assignmentId')
  if (!assignmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Assignment ID required' })
  }

  try {
    const { submissions } = await getCollections()
    const rows = await submissions.find({ assignmentId }).toArray()
    return rows
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch submissions' })
  }
})
