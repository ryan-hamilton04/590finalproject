import { getCollections } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  try {
    const { assignments, teachers } = await getCollections()
    const all = await assignments.find({}).toArray()

    // load teachers and build lookup maps
    const teachersList = await teachers.find({}).toArray()
    const teacherById: Record<string, any> = {}
    const teacherByEmail: Record<string, any> = {}
    for (const t of teachersList) {
      const tt: any = t
      if (tt?._id) teacherById[String(tt._id)] = tt
      if (tt?.email) teacherByEmail[String(tt.email)] = tt
    }

    // attach teacherName for UI convenience
    const results = all.map(a => {
      const rawTeacher = (a as any).teacherId
      const teacherCandidate = teacherById[String(rawTeacher)] || teacherByEmail[String(rawTeacher)] || null
      const teacherName = teacherCandidate?.name || teacherCandidate?.email || null
      return {
        ...a,
        teacherName
      }
    })

    return results
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch assignments' })
  }
})
