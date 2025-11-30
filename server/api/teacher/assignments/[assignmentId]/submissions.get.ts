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
    const { submissions, students, assignments } = await getCollections()
    const assignment = await assignments.findOne({ _id: assignmentId })

    // Load all students in this teacher's class (assigneeEmails if present else all teacher's students)
    const allStudents = await students.find({ teacherId }).toArray()
    const assigneeEmails: string[] = (assignment as any)?.assigneeEmails || allStudents.map(s => (s as any).email).filter(Boolean)
    const emailSet = new Set(assigneeEmails)

    const rowsRaw = await submissions.find({ assignmentId }).toArray()

    // Map submissions by student email (support ObjectId studentId by reverse lookup)
    const studentById: Record<string, any> = {}
    const studentByEmail: Record<string, any> = {}
    for (const s of allStudents) {
      const ss: any = s
      if (ss?._id) studentById[String(ss._id)] = ss
      if (ss?.email) studentByEmail[String(ss.email)] = ss
    }

    const submissionsByEmail: Record<string, any> = {}
    for (const sub of rowsRaw) {
      const sid = (sub as any).studentId
      const email = studentByEmail[String(sid)] ? studentByEmail[String(sid)].email : (typeof sid === 'string' ? sid : null)
      if (email) submissionsByEmail[email] = sub
    }

    // Build grouped lists
    const groups = { needToDo: [] as any[], inProgress: [] as any[], complete: [] as any[] }
    for (const email of emailSet) {
      const sub = submissionsByEmail[email]
      const status = sub?.status || 'need to do'
      const student = studentByEmail[email]
      const entry = { email, name: student?.name || email, status }
      if (status === 'complete') groups.complete.push(entry)
      else if (status === 'in progress') groups.inProgress.push(entry)
      else groups.needToDo.push(entry)
    }

    return {
      assignmentId,
      groups
    }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch submissions' })
  }
})
