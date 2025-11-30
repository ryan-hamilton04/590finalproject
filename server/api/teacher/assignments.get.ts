import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherEmail = (session.user as any)?.email
  const providerId = (session.user as any)?.id?.toString()
  const teacherKey = providerId || teacherEmail
  if (!teacherKey) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  // require teacher role + teacher mode
  const u = (session.user as any) || {}
  const roles: string[] = u.roles || []
  const mode: string = u.mode || 'student'
  if (!(roles.includes('teacher') && mode === 'teacher')) {
    throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })
  }

  try {
    const { assignments, submissions, students } = await getCollections()
  const myAssignments = await assignments.find({ $or: [ { teacherProviderId: teacherKey }, { teacherId: teacherKey } ] }).toArray()

    // Load submissions for these assignments
    const assignmentIds = myAssignments.map(a => String(a._id))
    const allSubs = await submissions.find({ assignmentId: { $in: assignmentIds } }).toArray()

    // Map student ObjectId/email to display name (load students)
  const studentsList = await students.find({ $or: [ { teacherProviderId: teacherKey }, { teacherId: teacherKey } ] }).toArray()
    const studentById: Record<string, any> = {}
    const studentByEmail: Record<string, any> = {}
    for (const s of studentsList) {
      const ss: any = s
      if (ss?._id) studentById[String(ss._id)] = ss
      if (ss?.email) studentByEmail[String(ss.email)] = ss
    }

    // Build submission buckets per assignment
    interface Counts { needToDo: number; inProgress: number; complete: number }
    const countsByAssignment: Record<string, Counts> = {}
    for (const id of assignmentIds) {
      countsByAssignment[id] = { needToDo: 0, inProgress: 0, complete: 0 }
    }

    for (const sub of allSubs) {
      const aid = String(sub.assignmentId)
      if (!countsByAssignment[aid]) continue
      const status = (sub as any).status || 'need to do'
      if (status === 'complete') countsByAssignment[aid].complete++
      else if (status === 'in progress') countsByAssignment[aid].inProgress++
      else countsByAssignment[aid].needToDo++
    }

    // For students without a submission yet treat as need to do
    for (const a of myAssignments) {
      const aid = String(a._id)
      const totalAssignees = Array.isArray((a as any).assigneeEmails) ? (a as any).assigneeEmails.length : studentsList.length
      const counted = countsByAssignment[aid].needToDo + countsByAssignment[aid].inProgress + countsByAssignment[aid].complete
      if (totalAssignees > counted) {
        countsByAssignment[aid].needToDo += (totalAssignees - counted)
      }
    }

    const results = myAssignments.map(a => ({
      ...a,
      statusCounts: countsByAssignment[String(a._id)]
    }))

    return results
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch assignments' })
  }
})
