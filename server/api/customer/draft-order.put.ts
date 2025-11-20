import { getCollections } from '../../utils/mongo'
import type { DraftOrder } from '../../utils/data'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const customerId = (session.user as any)?.email

  if (!customerId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const body = await readBody<DraftOrder>(event)

  if (!body || !Array.isArray(body.ingredients)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order data'
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
          ingredients: body.ingredients
        }
      },
      {
        upsert: true
      }
    )

    return { status: "ok" }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update draft order'
    })
  }
})
