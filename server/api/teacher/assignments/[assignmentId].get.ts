import { getCollections } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherEmail = (session.user as any)?.email as string | undefined
  const providerId = (session.user as any)?.id?.toString() as string | undefined
  if (!teacherEmail && !providerId) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const roles: string[] = (session.user as any)?.roles || []
  const mode: string = (session.user as any)?.mode
  if (!(roles.includes('teacher') && mode === 'teacher')) throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })

  const assignmentId = getRouterParam(event, 'assignmentId')
  if (!assignmentId) throw createError({ statusCode: 400, statusMessage: 'assignmentId required' })

  try {
    const { assignments } = await getCollections()
    const a = await assignments.findOne({ _id: assignmentId })
    if (!a) throw createError({ statusCode: 404, statusMessage: 'Assignment not found' })

    // Authorization: teacher must own assignment (dual-key)
    const owns = (teacherEmail && a.teacherId === teacherEmail) || (providerId && a.teacherProviderId === providerId)
    if (!owns) throw createError({ statusCode: 403, statusMessage: 'Not your assignment' })

    return {
      _id: a._id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      assigneeEmails: a.assigneeEmails || [],
      teacherId: a.teacherId,
      teacherProviderId: a.teacherProviderId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw createError({ statusCode: 500, statusMessage: 'Failed to load assignment' })
  }
})
