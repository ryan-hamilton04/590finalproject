import { MongoClient, Db } from 'mongodb'
import type { Customer, Order, Operator } from './data'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToMongo(): Promise<Db> {
  if (db) {
    return db
  }

  const mongoUrl = process.env.MONGO_URL
  const dbName = process.env.MONGO_DB_NAME || 'smoothie_stand'

  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is required')
  }

  client = new MongoClient(mongoUrl)

  try {
    await client.connect()
    console.log(`Connected successfully to MongoDB at ${mongoUrl}`)

    db = client.db(dbName)
    console.log(`Using database: ${dbName}`)

    return db
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

export async function getCollections() {
  const database = await connectToMongo()

  return {
    customers: database.collection<Customer>('customers'),
    orders: database.collection<Order>('orders'),
    operators: database.collection<Operator>('operators')
  }
}

export async function closeMongo() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
