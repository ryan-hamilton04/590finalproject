import { getCollections } from '../../utils/mongo'

// Time window helpers
function rollingStart(now = new Date()) { return now }
function rollingEnd(now = new Date()) {
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  return end
}

function startOfWeek(now = new Date()) {
  // Assume Monday start (0=Sunday). Adjust so Monday is day 1.
  const d = new Date(now)
  const day = d.getDay() // 0..6
  const diff = (day === 0 ? -6 : 1 - day) // move back to Monday
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diff)
  return d
}
function endOfWeek(now = new Date()) {
  const start = startOfWeek(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return end
}

function classifyUrgency(daysUntilDue: number) {
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= 2) return 'urgent'
  if (daysUntilDue <= 4) return 'warning'
  return 'ok'
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentEmail = (session.user as any)?.email
  if (!studentEmail) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const { assignments, submissions, teachers, students } = await getCollections()

    // find student's teacherId via students collection (student doc with matching email)
    const studentDoc = await students.findOne({ email: studentEmail })
    const myTeacherId = (studentDoc as any)?.teacherId

    const now = new Date()

    // Query params for mode & including past due assignments
    const q: any = getQuery(event)
    const mode = (q.mode === 'calendar') ? 'calendar' : 'rolling' // default rolling
    const includePast = q.includePast === 'true'
    // Optional lookback days for past-due inclusion (to avoid fetching ancient assignments)
    const lookbackDays = Math.min(Math.max(Number(q.lookbackDays) || 7, 1), 30)

    const windowStart = mode === 'calendar' ? startOfWeek(now) : rollingStart(now)
    const windowEnd = mode === 'calendar' ? endOfWeek(now) : rollingEnd(now)

    // Build dueDate filter
    let dueDateFilter: any
    if (includePast) {
      // Start can move backwards by lookbackDays for past-due collection
      const pastStart = new Date(windowStart)
      pastStart.setDate(pastStart.getDate() - lookbackDays)
      dueDateFilter = { $gte: pastStart as any, $lt: windowEnd as any }
    } else {
      dueDateFilter = { $gte: windowStart as any, $lt: windowEnd as any }
    }

    // Cast dates to any to satisfy TS since schema may define dueDate as Date
    const teacherFilter = myTeacherId ? { $or: [ { teacherProviderId: myTeacherId }, { teacherId: myTeacherId } ] } : {}
    const allAssignments = await assignments.find({ dueDate: dueDateFilter, ...teacherFilter } as any).toArray()

    const subs = await submissions.find({ studentId: studentEmail }).toArray()
    const subsByAid: Record<string, any> = {}
    for (const s of subs) subsByAid[String(s.assignmentId)] = s

    // teacher lookup
    const teachersList = await teachers.find({}).toArray()
    const teacherById: Record<string, any> = {}
    const teacherByEmail: Record<string, any> = {}
    for (const t of teachersList) {
      const tt: any = t
      if (tt?._id) teacherById[String(tt._id)] = tt
      if (tt?.email) teacherByEmail[String(tt.email)] = tt
    }

    const nowMs = Date.now()
    const results = allAssignments.map(a => {
      const aid = String(a._id)
      const rawTeacher = (a as any).teacherId
      const teacherCandidate = teacherById[String(rawTeacher)] || teacherByEmail[String(rawTeacher)] || null
      const teacherName = teacherCandidate?.name || teacherCandidate?.email || null
      const due = new Date((a as any).dueDate).getTime()
      // Allow negative values when including past
      let daysUntilDue = Math.ceil((due - nowMs) / (1000 * 60 * 60 * 24))
      if (!includePast) daysUntilDue = Math.max(0, daysUntilDue)
      const urgency = classifyUrgency(daysUntilDue)
      const daysPastDue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0
      return {
        ...a,
        teacherName,
        daysUntilDue,
        daysPastDue,
        urgency,
        mode,
        submission: subsByAid[aid] || null
      }
  }).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    return results
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch weekly assignments' })
  }
})