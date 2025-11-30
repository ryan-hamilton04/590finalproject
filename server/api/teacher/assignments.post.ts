import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherEmail = (session.user as any)?.email as string | undefined
  const providerId = (session.user as any)?.id?.toString() as string | undefined
  if (!teacherEmail && !providerId) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  // require teacher role + teacher mode
  const u = (session.user as any) || {}
  const roles: string[] = u.roles || []
  const mode: string = u.mode || 'student'
  if (!(roles.includes('teacher') && mode === 'teacher')) {
    throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })
  }

  const body = await readBody<{ title: string; description?: string; dueDate?: string; assigneeEmails?: string[]; allStudents?: boolean }>(event)
  if (!body || !body.title || !body.dueDate) {
    throw createError({ statusCode: 400, statusMessage: 'Title and dueDate required' })
  }

  try {
  const { assignments, students, submissions } = await getCollections()

    // Determine assignees: explicit list or all students in teacher's class using dual-key correctly
    let assigneeEmails: string[] = Array.isArray(body.assigneeEmails) ? body.assigneeEmails.filter(Boolean) : []
    if (body.allStudents || assigneeEmails.length === 0) {
      const or: any[] = []
      if (teacherEmail) or.push({ teacherId: teacherEmail }) // match by email key
      if (providerId) or.push({ teacherProviderId: providerId }) // match by provider key
  // If no keys, skip query (will result in empty list)
  const classStudents = or.length ? await students.find({ $or: or }).toArray() : []
      assigneeEmails = classStudents.map(s => (s as any).email).filter(Boolean)
      if ((body.allStudents || assigneeEmails.length === 0) && assigneeEmails.length === 0) {
        console.warn('[assignments.post] No students found for teacher', { teacherEmail, providerId })
      }
    }

    const now = new Date()
    const doc = {
      _id: `${Date.now()}`,
      title: body.title,
      description: body.description || '',
      dueDate: new Date(body.dueDate),
      teacherId: teacherEmail, // legacy email key retained
      ...(providerId ? { teacherProviderId: providerId } : {}), // only set provider key if present
      assigneeEmails,
      createdAt: now,
      updatedAt: now
    }

    await assignments.insertOne(doc as any)

    // Initialize per-student submission/status as 'need to do' (idempotent upsert)
    const nowIso = now.toISOString()
    for (const email of assigneeEmails) {
      if (!email) continue
      await submissions.updateOne(
        { assignmentId: doc._id, studentId: email },
        {
          $setOnInsert: {
            _id: `${doc._id}:${email}`,
            assignmentId: doc._id,
            studentId: email,
            status: 'need to do',
            content: '',
            createdAt: nowIso,
            updatedAt: nowIso
          }
        },
        { upsert: true }
      )
    }

  return { status: 'ok', assignmentId: doc._id, seededStatuses: assigneeEmails.length }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create assignment' })
  }
})
