import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentId = (session.user as any)?.email

  if (!studentId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const { assignments, submissions } = await getCollections()

    const allAssignments = await assignments.find({}).toArray()
    const mySubmissions = await submissions.find({ studentId }).toArray()

    const submissionsByAssignment: Record<string, any> = {}
    for (const s of mySubmissions) {
      submissionsByAssignment[s.assignmentId] = s
    }

    // Attach student's submission info to each assignment
    const results = allAssignments.map(a => ({
      ...a,
      submission: submissionsByAssignment[a._id] || null
    }))

    return results
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch assignments' })
  }
})
