import { getCollections } from '../utils/mongo'
import type { CustomerWithOrders } from '../utils/data'

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
    const { customers, orders } = await getCollections()

    let customer: Partial<CustomerWithOrders> | null = await customers.findOne({ _id: customerId })

    // If customer doesn't exist, create a basic record
    if (!customer) {
      const newCustomer = {
        _id: customerId,
        name: (session.user as any)?.name || customerId,
        email: customerId
      }

      await customers.insertOne(newCustomer)
      customer = newCustomer
    }

    // Fetch customer's orders
    customer.orders = await orders.find({
      customerId: customerId,
      state: { $ne: "draft" }
    }).toArray()

    return customer
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch customer'
    })
  }
})
