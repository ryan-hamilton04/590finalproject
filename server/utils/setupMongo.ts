import { connectToMongo } from './mongo'


async function main() {
  let db
  try {
    db = await connectToMongo()

    // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
    db.collection("orders").createIndex(
      { customerId: 1 },
      { unique: true, partialFilterExpression: { state: "draft" } }
    )
    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Failed to setup database:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
