import { getCollections } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentEmail = (session.user as any)?.email
  if (!studentEmail) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const assignmentId = getRouterParam(event, 'assignmentId')
  if (!assignmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Assignment ID required' })
  }

  try {
    const { assignments, submissions, teachers } = await getCollections()
    const assignment = await assignments.findOne({ _id: assignmentId })
    if (!assignment) {
      throw createError({ statusCode: 404, statusMessage: 'Assignment not found' })
    }

    // Resolve teacher name
    const teachersList = await teachers.find({}).toArray()
    const teacherById: Record<string, any> = {}
    const teacherByEmail: Record<string, any> = {}
    for (const t of teachersList) {
      const tt: any = t
      if (tt?._id) teacherById[String(tt._id)] = tt
      if (tt?.email) teacherByEmail[String(tt.email)] = tt
    }
    const rawTeacher = (assignment as any).teacherId
    const teacherCandidate = teacherById[String(rawTeacher)] || teacherByEmail[String(rawTeacher)] || null
    const teacherName = teacherCandidate?.name || teacherCandidate?.email || null

    const submission = await submissions.findOne({ assignmentId, studentId: studentEmail })

    return {
      ...assignment,
      teacherName,
      submission: submission || null
    }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load assignment detail' })
  }
})