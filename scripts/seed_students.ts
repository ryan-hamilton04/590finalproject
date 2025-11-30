import { getCollections, closeMongo } from '../server/utils/mongo'
import { ObjectId } from 'mongodb'

async function upsertOne(collection: any, filter: any, doc: any) {
  await collection.updateOne(filter, { $set: doc }, { upsert: true })
}

async function main() {
  try {
    const { students, teachers } = await getCollections()

    const now = new Date()

  // Primary teacher (from provided record)
  const teacherEmail = 'rh330@duke.edu'
  const otherTeacherEmail = 'other.teacher@example.edu'

    // Sample students set — concise, realistic names/emails.
    const sampleStudents = [
      { name: 'Ava Johnson', email: 'ava.johnson@example.edu', teacher: teacherEmail },
      { name: 'Mason Lee', email: 'mason.lee@example.edu', teacher: teacherEmail },
      { name: 'Olivia Patel', email: 'olivia.patel@example.edu', teacher: teacherEmail },
      { name: 'Noah Kim', email: 'noah.kim@example.edu', teacher: teacherEmail },
      { name: 'Sophia Nguyen', email: 'sophia.nguyen@example.edu', teacher: teacherEmail },
      { name: 'Lucas Rivera', email: 'lucas.rivera@example.edu', teacher: teacherEmail },
      // A few assigned to a different teacher
      { name: 'Mia Thompson', email: 'mia.thompson@example.edu', teacher: otherTeacherEmail },
      { name: 'Ethan Brooks', email: 'ethan.brooks@example.edu', teacher: otherTeacherEmail },
      { name: 'Isabella Chen', email: 'isabella.chen@example.edu', teacher: otherTeacherEmail },
      { name: 'James Walker', email: 'james.walker@example.edu', teacher: teacherEmail }
    ]

    for (const s of sampleStudents) {
      const doc = {
        _id: new ObjectId(),
        name: s.name,
        email: s.email,
        avatar: `https://www.gravatar.com/avatar/${Buffer.from(s.email).toString('hex').slice(0,32)}?s=80&d=identicon`,
        provider: 'gitlab',
        roles: ['student'],
        teacherId: s.teacher,
        createdAt: now,
        updatedAt: now
      }
      await upsertOne(students, { email: s.email }, doc)
    }

    const primaryCount = sampleStudents.filter(s => s.teacher === teacherEmail).length
    const otherCount = sampleStudents.filter(s => s.teacher === otherTeacherEmail).length
    console.log(`Seeded ${sampleStudents.length} students: ${primaryCount} -> ${teacherEmail}, ${otherCount} -> ${otherTeacherEmail}`)
  } catch (err) {
    console.error('Seed students failed:', err)
    process.exitCode = 1
  } finally {
    await closeMongo()
  }
}

main()
