import { getCollections } from '../utils/mongo'
import type { TeacherWithOrders } from '../utils/data'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherId = (session.user as any)?.email

  if (!teacherId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check if user is a teacher in teacher mode
  const u = (session.user as any) || {}
  const roles: string[] = u.roles || []
  const mode: string = u.mode || 'student'
  if (!(roles.includes('teacher') && mode === 'teacher')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Teacher role required'
    })
  }

  try {
    const { teachers, orders } = await getCollections()

    let teacher: Partial<TeacherWithOrders> | null = await teachers.findOne({ _id: teacherId })

    // If teacher doesn't exist, create a basic record
    if (!teacher) {
      const newTeacher = {
        _id: teacherId,
        name: (session.user as any)?.name || teacherId,
        email: teacherId
      }

      await teachers.insertOne(newTeacher)
      teacher = newTeacher
    }

    // Fetch teacher's orders
    teacher.orders = await orders.find({ teacherId: teacherId }).toArray()

    return teacher
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch teacher'
    })
  }
})
