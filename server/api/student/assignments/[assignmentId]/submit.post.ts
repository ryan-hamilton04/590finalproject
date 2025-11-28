import { getCollections } from '../../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentId = (session.user as any)?.email

  if (!studentId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const assignmentId = getRouterParam(event, 'assignmentId')
  if (!assignmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Assignment ID required' })
  }

  const body = await readBody<{ status?: any; content?: string }>(event)
  const status: 'need to do' | 'in progress' | 'complete' = body?.status || 'need to do'

  const allowed = ['need to do', 'in progress', 'complete']
  if (!allowed.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  try {
    const { submissions } = await getCollections()

    const now = new Date().toISOString()

    await submissions.updateOne(
      { assignmentId, studentId },
      { $set: { status: status as any, content: body?.content || '', submittedAt: now } },
      { upsert: true }
    )

    return { status: 'ok' }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit assignment' })
  }
})
