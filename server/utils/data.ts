export interface StringIdDocument {
  _id: string
}

export interface Student extends StringIdDocument {
  name: string
  email: string
  teacherId?: string // teacher email who manages this student
  teacherProviderId?: string // stable provider id for teacher (migration)
  avatar?: string
  provider?: 'github' | 'gitlab' | 'demo' | string
  roles?: string[]
  mode?: 'student' | 'teacher'
  createdAt?: string
  updatedAt?: string
}

export interface Teacher {
  _id: string
  name: string
  email: string
  providerId?: string // stable provider user id separate from email
  avatar?: string
  provider?: 'github' | 'gitlab' | 'demo' | string
  roles?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Assignment extends StringIdDocument {
  title: string
  description?: string
  dueDate?: string // ISO date string
  classId?: string
  teacherId: string
  teacherProviderId?: string // stable provider id for teacher (migration)
  assigneeEmails?: string[]
  createdAt?: string
  updatedAt?: string
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

export interface AssignmentStatusCounts {
  needToDo: number
  inProgress: number
  complete: number
}

export interface AssignmentWithCounts extends Assignment {
  statusCounts: AssignmentStatusCounts
}