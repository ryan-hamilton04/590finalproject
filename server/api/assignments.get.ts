import { getCollections } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  try {
    const { assignments } = await getCollections()
    const all = await assignments.find({}).toArray()
    return all
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch assignments' })
  }
})
