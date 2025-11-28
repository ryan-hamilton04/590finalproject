import { getCollections } from '../utils/mongo'
import type { StudentWithOrders } from '../utils/data'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const studentId = (session.user as any)?.email

  if (!studentId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    const { students, orders } = await getCollections()

    let student: Partial<StudentWithOrders> | null = await students.findOne({ _id: studentId })

    // If student doesn't exist, create a basic record
    if (!student) {
      const newStudent = {
        _id: studentId,
        name: (session.user as any)?.name || studentId,
        email: studentId
      }

      await students.insertOne(newStudent)
      student = newStudent
    }

    // Fetch student's orders
    student.orders = await orders.find({
      studentId: studentId,
      state: { $ne: "draft" }
    }).toArray()

    return student
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch student'
    })
  }
})
