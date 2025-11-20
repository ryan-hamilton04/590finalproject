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

    const draftOrder = await orders.findOne({
      state: "draft",
      customerId: customerId
    })

    return draftOrder || { customerId, ingredients: [] }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch draft order'
    })
  }
})
