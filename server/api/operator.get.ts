import { getCollections } from '../utils/mongo'
import type { OperatorWithOrders } from '../utils/data'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const operatorId = (session.user as any)?.email

  if (!operatorId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check if user has operator role
  if (!(session.user as any)?.roles?.includes('operator')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Operator role required'
    })
  }

  try {
    const { operators, orders } = await getCollections()

    let operator: Partial<OperatorWithOrders> | null = await operators.findOne({ _id: operatorId })

    // If operator doesn't exist, create a basic record
    if (!operator) {
      const newOperator = {
        _id: operatorId,
        name: (session.user as any)?.name || operatorId,
        email: operatorId
      }

      await operators.insertOne(newOperator)
      operator = newOperator
    }

    // Fetch operator's orders
    operator.orders = await orders.find({ operatorId: operatorId }).toArray()

    return operator
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch operator'
    })
  }
})
