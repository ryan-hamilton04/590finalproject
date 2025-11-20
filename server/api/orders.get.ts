import { getCollections } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  try {
    const { orders } = await getCollections()
    const orderList = await orders.find({ state: { $ne: "draft" } }).toArray()
    return orderList
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch orders'
    })
  }
})
