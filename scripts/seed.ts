// @ts-nocheck
import { getCollections, closeMongo } from '../server/utils/mongo'
import { ObjectId } from 'mongodb'

async function upsertOne<T extends { email?: string }>(collection: any, filter: any, doc: any) {
  await collection.updateOne(filter, { $set: doc }, { upsert: true })
}

async function main() {
  try {
    const { students, teachers, assignments, submissions } = await getCollections()

    // Teachers (two simple teachers)
    const teacherAliceId = new ObjectId()
    const teacherBobId = new ObjectId()

    const teacherAlice = {
      _id: teacherAliceId,
      name: 'Ms. Alice',
      email: 'alice@school.example',
      githubId: 'alice-teacher',
      createdAt: new Date()
    }
    const teacherBob = {
      _id: teacherBobId,
      name: 'Mr. Bob',
      email: 'bob@school.example',
      githubId: 'bob-teacher',
      createdAt: new Date()
    }

    await upsertOne(teachers, { email: teacherAlice.email }, teacherAlice)
    await upsertOne(teachers, { email: teacherBob.email }, teacherBob)

    // Students
    const studentJaneId = new ObjectId()
    const studentTomId = new ObjectId()
    const studentEmmaId = new ObjectId()

    const studentsToSeed = [
      { _id: studentJaneId, name: 'Jane', email: 'jane@student.example', githubId: 'jane-student', createdAt: new Date() },
      { _id: studentTomId, name: 'Tom', email: 'tom@student.example', githubId: 'tom-student', createdAt: new Date() },
      { _id: studentEmmaId, name: 'Emma', email: 'emma@student.example', githubId: 'emma-student', createdAt: new Date() }
    ]

    for (const s of studentsToSeed) {
      await upsertOne(students, { email: s.email }, s)
    }

    // Simple 4th-grade assignments (idempotent upsert by title + teacher)
    const assignment1Id = new ObjectId()
    const assignment2Id = new ObjectId()
    const assignment3Id = new ObjectId()

    const assignment1 = {
      _id: assignment1Id,
      title: 'Math: Multiplication Practice',
      description: 'Complete the multiplication worksheet (times tables).',
      teacherId: teacherAliceId,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    }

    const assignment2 = {
      _id: assignment2Id,
      title: 'Reading: Short Story Summary',
      description: 'Read the short story and write a 3-sentence summary.',
      teacherId: teacherBobId,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    }

    const assignment3 = {
      _id: assignment3Id,
      title: 'Science: Plant Growth',
      description: 'Observe a plant for 1 week and note changes.',
      teacherId: teacherAliceId,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }

    await upsertOne(assignments, { title: assignment1.title, teacherId: assignment1.teacherId }, assignment1)
    await upsertOne(assignments, { title: assignment2.title, teacherId: assignment2.teacherId }, assignment2)
    await upsertOne(assignments, { title: assignment3.title, teacherId: assignment3.teacherId }, assignment3)

    // Sample submissions (upsert by assignmentId + studentId)
    const sub1 = {
      _id: new ObjectId(),
      assignmentId: assignment1Id,
      studentId: studentJaneId,
      status: 'in progress',
      content: 'Working on multiplication problems 1-10',
      updatedAt: new Date()
    }

    const sub2 = {
      _id: new ObjectId(),
      assignmentId: assignment2Id,
      studentId: studentTomId,
      status: 'need to do',
      content: '',
      updatedAt: new Date()
    }

    await submissions.updateOne({ assignmentId: sub1.assignmentId, studentId: sub1.studentId }, { $set: sub1 }, { upsert: true })
    await submissions.updateOne({ assignmentId: sub2.assignmentId, studentId: sub2.studentId }, { $set: sub2 }, { upsert: true })

    console.log('Seed complete: teachers, students, assignments, submissions inserted/upserted.')
  } catch (err) {
    console.error('Seed failed:', err)
    process.exitCode = 1
  } finally {
    await closeMongo()
  }
}

main()
