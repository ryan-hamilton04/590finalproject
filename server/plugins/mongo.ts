import { connectToMongo } from '../utils/mongo'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    await connectToMongo()
    console.log('MongoDB connection initialized')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
  }
})
