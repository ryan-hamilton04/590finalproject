<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-primary-600">Teacher Assignments</h1>
            <p class="text-gray-600">Create assignments and review submissions</p>
          </div>
          <div>
            <UButton @click="refresh" :loading="loading" variant="outline">Refresh</UButton>
          </div>
        </div>
      </template>

      <div class="mt-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold mb-2">Create Assignment</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <UInput v-model="form.title" placeholder="Title" />
            <UInput v-model="form.dueDate" placeholder="Due date (YYYY-MM-DD)" />
            <UButton color="primary" @click="createAssignment" :loading="creating">Create</UButton>
          </div>
          <UInput v-model="form.description" placeholder="Description" class="mt-2" />
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-2">Your Assignments</h2>
          <UTable :data="assignments" :columns="columns" :loading="loading">
            <template #cell-submissions="{ row }">
              <div>
                <UButton size="sm" @click="viewSubmissions(row.original._id)" :loading="loadingSubmissions[row.original._id]">View Submissions</UButton>
              </div>
            </template>
          </UTable>
        </div>

        <div v-if="currentSubmissions.length">
          <h2 class="text-lg font-semibold mb-2">Submissions for {{ currentAssignmentTitle }}</h2>
          <UTable :data="currentSubmissions" :columns="submissionColumns" />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { Assignment } from '../data'
import { reactive } from 'vue'

const { user } = useUserSession()

const assignments = ref<any[]>([])
const loading = ref(false)
const creating = ref(false)
const loadingSubmissions = reactive<Record<string, boolean>>({})

const form = reactive({ title: '', description: '', dueDate: '' })

const columns = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'dueDate', header: 'Due' },
  { id: 'submissions', header: 'Submissions', accessorFn: (r: any) => '' }
]

const submissionColumns = [
  { accessorKey: 'studentId', header: 'Student' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'submittedAt', header: 'Submitted At' },
  { accessorKey: 'content', header: 'Content' }
]

const currentSubmissions = ref<any[]>([])
const currentAssignmentTitle = ref('')

async function refresh() {
  loading.value = true
  try {
  assignments.value = await $fetch<any[]>('/api/teacher/assignments')
  } catch (err) {
    console.error('Failed to load assignments', err)
  } finally {
    loading.value = false
  }
}

async function createAssignment() {
  if (!form.title) return
  creating.value = true
  try {
    await $fetch('/api/teacher/assignments', {
      method: 'POST',
      body: { title: form.title, description: form.description, dueDate: form.dueDate }
    })
    form.title = ''
    form.description = ''
    form.dueDate = ''
    await refresh()
  } catch (err) {
    console.error('Failed to create assignment', err)
  } finally {
    creating.value = false
  }
}

async function viewSubmissions(assignmentId: string) {
  loadingSubmissions[assignmentId] = true
  try {
  const subs = await $fetch<any[]>(`/api/teacher/assignments/${assignmentId}/submissions`)
    currentSubmissions.value = subs
    const found = assignments.value.find((a: any) => a._id === assignmentId)
    currentAssignmentTitle.value = found?.title || assignmentId
  } catch (err) {
    console.error('Failed to load submissions', err)
  } finally {
    loadingSubmissions[assignmentId] = false
  }
}

watch(() => user.value, (u) => { if (u) refresh() }, { immediate: true })
</script>
