<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-primary-600">
          Welcome, {{ (user as any)?.name }}
        </h1>
        <p class="text-gray-600">Student Assignments</p>
      </template>

      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Assignments</h2>
            <UButton @click="refresh" icon="i-heroicons-arrow-path" variant="outline" :loading="loading">
              Refresh
            </UButton>
          </div>

          <UTable
            :data="assignments"
            :columns="columns"
            :loading="loading"
            :empty-state="{
              icon: 'i-heroicons-book-open',
              label: 'No assignments',
              description: 'Your teacher has not assigned anything yet.'
            }"
          >
            <template #cell-action="{ row }">
              <div class="flex items-center gap-2">
                <USelect
                  :items="statuses"
                    v-model="localStatus[row.original._id]"
                  size="sm"
                />
                  <UButton size="sm" @click="submitStatus(row.original._id)" :loading="saving[row.original._id]">
                  Save
                </UButton>
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { Assignment } from '../data'
import { reactive } from 'vue'
import { formatDateToYMD } from '../utils/format'

const { user } = useUserSession()

const assignments = ref<any[]>([])
const loading = ref(false)
const saving = reactive<Record<string, boolean>>({})
const localStatus = reactive<Record<string, string>>({})

const statuses = ['need to do', 'in progress', 'complete']

const columns = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { id: 'dueDate', header: 'Due', accessorFn: (r: any) => formatDateToYMD(r.dueDate) },
  { accessorKey: 'teacherId', header: 'Teacher' },
  { id: 'submission', header: 'Your Status', accessorFn: (row: any) => row.submission?.status || 'need to do' },
  { id: 'action', header: 'Action' }
]

async function refresh() {
  loading.value = true
  try {
    const res = await $fetch<any[]>('/api/student/assignments')
    assignments.value = res.map(a => ({ ...a }))
    // initialize local status from submission if present
    for (const a of assignments.value) {
      localStatus[a._id] = ((a as any).submission && (a as any).submission.status) || 'need to do'
      saving[a._id] = false
    }
  } catch (err) {
    console.error('Failed to load assignments', err)
  } finally {
    loading.value = false
  }
}

async function submitStatus(assignmentId: string) {
  saving[assignmentId] = true
  try {
    await $fetch(`/api/student/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: { status: localStatus[assignmentId] }
    })
    // refresh submission state
    await refresh()
  } catch (err) {
    console.error('Failed to submit status', err)
  } finally {
    saving[assignmentId] = false
  }
}

watch(() => user.value, (u) => {
  if (u) refresh()
}, { immediate: true })
</script>
