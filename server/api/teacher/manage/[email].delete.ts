import { getCollections } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const teacherEmail = (session.user as any)?.email as string | undefined
  const providerId = (session.user as any)?.id?.toString() as string | undefined
  if (!teacherEmail && !providerId) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  const roles = (session.user as any)?.roles || []
  const mode = (session.user as any)?.mode
  if (!(roles.includes('teacher') && mode === 'teacher')) throw createError({ statusCode: 403, statusMessage: 'Teacher role required' })

  const email = getRouterParam(event, 'email')
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Student email required' })

  // Build dual-key match with proper separation.
  const or: any[] = []
  if (teacherEmail) or.push({ teacherId: teacherEmail })
  if (providerId) or.push({ teacherProviderId: providerId })

  try {
    const { students } = await getCollections()
    await students.deleteOne({ email, $or: or })
    return { status: 'ok' }
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove student' })
  }
})