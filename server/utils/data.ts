export interface StringIdDocument {
  _id: string
}

export interface Student extends StringIdDocument {
  name: string
}

export interface Teacher {
  _id: string
  name: string
}

// TaskMate domain types
export interface Assignment extends StringIdDocument {
  title: string
  description?: string
  dueDate?: string // ISO date string
  classId?: string
  teacherId: string
  createdAt?: string
}

export type SubmissionStatus = 'need to do' | 'in progress' | 'complete'

export interface Submission extends StringIdDocument {
  assignmentId: string
  studentId: string
  status: SubmissionStatus
  submittedAt?: string
  content?: string
}

export interface StudentWithSubmissions extends Student {
  submissions: Submission[]
}

export interface TeacherWithAssignments extends Teacher {
  assignments: Assignment[]
}