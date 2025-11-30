<template>
  <UContainer class="py-8">
    <!-- Welcome Section for Authenticated Users -->
    <div v-if="loggedIn" class="mb-8">
      <UCard>
        <div class="flex items-center space-x-4">
          <UAvatar
            :src="user?.avatar"
            :alt="user?.name"
            size="lg"
          />
          <div>
            <h1 class="text-2xl font-bold">Welcome back, {{ user?.name }}!</h1>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Public Welcome for Non-Authenticated Users -->
    <div v-else class="mb-8">
      <UCard>
        <div class="text-center py-8">
          <h1 class="text-3xl font-bold mb-4">✔️ Welcome to TaskMate</h1>
          <p class="text-gray-600 mb-6">Sign in to view your tasks</p>
          <UButton to="/login" size="lg">
            Get Started
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Role-aware Assignments Section -->
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold" v-if="isTeacher">Assignments You've Posted</h2>
        <h2 class="text-2xl font-bold" v-else>Upcoming Class Work</h2>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <UButton @click="refresh" icon="i-heroicons-arrow-path" :loading="loading">
            Refresh
          </UButton>
          <div v-if="isTeacher" class="flex gap-2">
            <UButton to="/teacher/create" variant="outline" icon="i-heroicons-plus">New Assignment</UButton>
            <UButton to="/teacher/manage" variant="outline" icon="i-heroicons-users">Manage Class</UButton>
          </div>
          <div v-else class="flex items-center gap-3">
            <!-- Mode selector replaced with button group for clearer visibility -->
            <UButtonGroup size="xs">
              <UButton :variant="mode==='rolling' ? 'solid' : 'ghost'" @click="setMode('rolling')">
                Rolling 7 Days
              </UButton>
              <UButton :variant="mode==='calendar' ? 'solid' : 'ghost'" @click="setMode('calendar')">
                Calendar Week
              </UButton>
            </UButtonGroup>
            <!-- Replace non-functional UToggle with USwitch (Nuxt UI) -->
            <USwitch v-model="includePast" size="sm" label="Include Past Due" />
          </div>
        </div>

        <UTable
          :data="assignments"
          :columns="columns"
          :loading="loading"
          :empty-state="{
            icon: 'i-heroicons-book-open',
            label: isTeacher ? 'No assignments yet.' : 'No assignments due this week.',
            description: isTeacher ? 'Create an assignment for your class.' : 'Check back later for new assignments.'
          }"
          @row:click="rowClick"
          class="cursor-pointer"
        />
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { Assignment } from "../../server/utils/data"
import { formatDateToYMD } from '../../server/utils/format'

definePageMeta({
  auth: false
})

const { loggedIn, user } = useUserSession()

const assignments = ref<any[]>([])
const loading = ref(false)
const mode = ref<'rolling' | 'calendar'>('rolling')
const includePast = ref(false)
// Removed select menu in favor of explicit button group
function setMode(m: 'rolling' | 'calendar') {
  if (mode.value !== m) mode.value = m
}

const isTeacher = computed(() => {
  const u: any = user.value
  if (!u) return false
  return Array.isArray(u.roles) && u.roles.includes('teacher') && u.mode === 'teacher'
})

const studentColumns: TableColumn<any>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: any) => {
      const id = row.original._id || row.original.id
      return h(
        'a',
        {
          href: id ? `/assignment/${id}` : undefined,
          class: 'text-primary underline hover:no-underline',
          onClick: (e: Event) => {
            e.preventDefault()
            if (id) navigateTo(`/assignment/${id}`)
          }
        },
        row.original.title
      )
    }
  },
  { accessorKey: 'teacherName', header: 'Teacher' },
  {
    id: 'daysUntilDue',
    header: 'Time',
    cell: ({ row }: any) => {
      const r = row.original
      const urgency = r.urgency
      const days = r.daysUntilDue
      const past = days < 0
      const colorMap: Record<string, string> = {
        overdue: 'red',
        urgent: 'red',
        warning: 'yellow',
        ok: 'green'
      }
      const label = past ? `Past due (${Math.abs(days)}d)` : `${days}d left`
      return h(
        'span',
        {},
        [ h('span', { class: `inline-block rounded px-2 py-1 text-xs font-medium bg-${colorMap[urgency]}-100 text-${colorMap[urgency]}-700` }, label) ]
      )
    }
  },
  { id: 'status', header: 'Status', accessorFn: (row: any) => row.submission?.status || 'need to do' }
]

const teacherColumns: TableColumn<any>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: any) => {
      const id = row.original._id || row.original.id
      return h(
        'a',
        {
          href: id ? `/teacher/assignment/${id}` : undefined,
          class: 'text-primary underline hover:no-underline',
          onClick: (e: Event) => {
            e.preventDefault()
            if (id) navigateTo(`/teacher/assignment/${id}`)
          }
        },
        row.original.title
      )
    }
  },
  { id: 'dueDate', header: 'Due', accessorFn: (row: any) => formatDateToYMD(row.dueDate) },
  { id: 'needToDo', header: 'Need To Do', accessorFn: (row: any) => row.statusCounts?.needToDo || 0 },
  { id: 'inProgress', header: 'In Progress', accessorFn: (row: any) => row.statusCounts?.inProgress || 0 },
  { id: 'complete', header: 'Complete', accessorFn: (row: any) => row.statusCounts?.complete || 0 }
]

const columns = computed(() => isTeacher.value ? teacherColumns : studentColumns)

async function refresh() {
  loading.value = true
  try {
    if (isTeacher.value) {
      assignments.value = await $fetch<any[]>('/api/teacher/assignments')
    } else if (loggedIn.value) {
      // Bust cache with timestamp to ensure students see latest edits; include mode & includePast toggles
      assignments.value = await $fetch<any[]>(`/api/student/assignments.week?mode=${mode.value}&includePast=${includePast.value}&ts=${Date.now()}`)
    } else {
      assignments.value = await $fetch<any[]>('/api/assignments')
    }
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
  } finally {
    loading.value = false
  }
}

function rowClick(row: any) {
  const id = row._id || row.id
  if (!id) return
  if (isTeacher.value) {
    navigateTo(`/teacher/assignment/${id}`)
  } else {
    navigateTo(`/assignment/${id}`)
  }
}

watch([user, loggedIn, isTeacher, mode, includePast], () => {
  refresh()
}, { immediate: true })
</script>
