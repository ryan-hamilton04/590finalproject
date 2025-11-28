import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentId = (session.user as any)?.email

  if (!studentId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const { assignments, submissions, teachers } = await getCollections()

    const allAssignments = await assignments.find({}).toArray()
    const mySubmissions = await submissions.find({ studentId }).toArray()

    // Normalize submission lookup by using stringified assignmentId keys
    const submissionsByAssignment: Record<string, any> = {}
    for (const s of mySubmissions) {
      submissionsByAssignment[String(s.assignmentId)] = s
    }

    // Load teachers and build a quick lookup by _id (string) and email
    const teachersList = await teachers.find({}).toArray()
    const teacherById: Record<string, any> = {}
    const teacherByEmail: Record<string, any> = {}
    for (const t of teachersList) {
      const tt: any = t
      if (tt?._id) teacherById[String(tt._id)] = tt
      if (tt?.email) teacherByEmail[String(tt.email)] = tt
    }

    // Attach student's submission info and teacherName to each assignment
    const results = allAssignments.map(a => {
      const assignmentKey = String(a._id)
      const rawTeacher = a.teacherId
      // teacherId may be stored as ObjectId or as an email/string in some cases
      const teacherCandidate = teacherById[String(rawTeacher)] || teacherByEmail[String(rawTeacher)] || null
      const teacherName = teacherCandidate?.name || (teacherCandidate?.email) || null

      return {
        ...a,
        teacherName,
        submission: submissionsByAssignment[assignmentKey] || null
      }
    })

    return results
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch assignments' })
  }
})
