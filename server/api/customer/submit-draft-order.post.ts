import { getCollections } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const customerId = (session.user as any)?.email

  if (!customerId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    const { orders } = await getCollections()

    const result = await orders.updateOne(
      {
        customerId: customerId,
        state: "draft",
      },
      {
        $set: {
          state: "queued",
        }
      }
    )

    if (result.modifiedCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No draft order found'
      })
    }

    return { status: "ok" }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit draft order'
    })
  }
})
