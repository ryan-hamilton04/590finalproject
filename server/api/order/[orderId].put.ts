import { ObjectId } from 'mongodb'
import { getCollections } from '../../utils/mongo'
import type { Order } from '../../utils/data'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'orderId')

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order ID is required'
    })
  }

  const body = await readBody<Order>(event)

  if (!body || !body.state || !body.operatorId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order data'
    })
  }

  try {
    const { orders } = await getCollections()

    const condition: any = {
      _id: new ObjectId(orderId),
      state: {
        $in: [
          // because PUT is idempotent, ok to call PUT twice in a row with the existing state
          body.state
        ]
      },
    }

    switch (body.state) {
      case "blending":
        condition.state.$in.push("queued")
        // can only go to blending state if no operator assigned (or is the current user, due to idempotency)
        condition.$or = [
          { operatorId: { $exists: false } },
          { operatorId: body.operatorId }
        ]
        break
      case "done":
        condition.state.$in.push("blending")
        condition.operatorId = body.operatorId
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid state'
        })
    }

    const result = await orders.updateOne(
      condition,
      {
        $set: {
          state: body.state,
          operatorId: body.operatorId,
        }
      }
    )

    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID does not exist or state change not allowed'
      })
    }

    return { status: "ok" }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update order'
    })
  }
})
