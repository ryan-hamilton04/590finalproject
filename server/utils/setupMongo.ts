import { connectToMongo } from './mongo'


async function main() {
  let db
  try {
    db = await connectToMongo()

    // New indexes for TaskMate domain
    // Ensure assignments can be queried efficiently by teacher
    await db.collection('assignments').createIndex({ teacherId: 1 })

    // Ensure submissions can be queried by assignment and student quickly
    await db.collection('submissions').createIndex({ assignmentId: 1 })
    // Prevent a student from having multiple submissions for the same assignment
    await db.collection('submissions').createIndex(
      { assignmentId: 1, studentId: 1 },
      { unique: true }
    )

    // Helpful uniqueness indexes for users
    await db.collection('students').createIndex({ email: 1 }, { unique: true, sparse: true })
    await db.collection('teachers').createIndex({ email: 1 }, { unique: true, sparse: true })

    console.log('Database setup completed successfully (assignments/submissions indexes)')
  } catch (error) {
    console.error('Failed to setup database:', error)
    process.exit(1)
  } finally {
    // exit explicitly so this script can be used from CI or local shells
    process.exit(0)
  }
}

main()
