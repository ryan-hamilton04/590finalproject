import { getCollections } from '../../../utils/mongo'

interface UpdateBody {
  title?: string
  description?: string
  dueDate?: string
}

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

  const body = await readBody<UpdateBody>(event)
  if (!body || (!body.title && !body.description && !body.dueDate)) {
    throw createError({ statusCode: 400, statusMessage: 'No update fields supplied' })
  }

  try {
    const { assignments } = await getCollections()
    const a = await assignments.findOne({ _id: assignmentId })
    if (!a) throw createError({ statusCode: 404, statusMessage: 'Assignment not found' })
    const owns = (teacherEmail && a.teacherId === teacherEmail) || (providerId && a.teacherProviderId === providerId)
    if (!owns) throw createError({ statusCode: 403, statusMessage: 'Not your assignment' })

    const update: any = { updatedAt: new Date() }
    if (body.title) update.title = body.title
    if (body.description !== undefined) update.description = body.description
    if (body.dueDate) update.dueDate = new Date(body.dueDate)

    await assignments.updateOne({ _id: assignmentId }, { $set: update })
    return { status: 'ok' }
  } catch (err: any) {
    // Re-throw known h3 errors, otherwise wrap
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Failed to update assignment' })
  }
})
