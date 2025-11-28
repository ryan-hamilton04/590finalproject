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
            <p class="text-gray-600">Manage your tasks</p>
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

    <!-- Assignments Section (visible to everyone) -->
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Tasks</h2>
      </template>

      <div class="space-y-4">
        <UButton @click="refresh" icon="i-heroicons-arrow-path" :loading="loading">
          Refresh Tasks
        </UButton>

        <UTable
          :data="assignments"
          :columns="columns"
          :loading="loading"
          :empty-state="{
            icon: 'i-heroicons-book-open',
            label: 'No tasks found.',
            description: 'Teachers can assign tasks and they will show up here.'
          }"
        />
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { Assignment } from "../data"
import { formatDateToYMD } from '../utils/format'

definePageMeta({
  auth: false
})

const { loggedIn, user } = useUserSession()

const assignments = ref<Assignment[]>([])
const loading = ref(false)

const columns: TableColumn<any>[] = [
  { accessorKey: '_id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
  { id: 'dueDate', header: 'Due', accessorFn: (row: any) => formatDateToYMD(row.dueDate) },
  { accessorKey: 'teacherId', header: 'Teacher' },
]

async function refresh() {
  loading.value = true
  try {
    const data = await $fetch<Assignment[]>('/api/assignments')
    assignments.value = data || []
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
  } finally {
    loading.value = false
  }
}

// Load orders on page mount
onMounted(refresh)
</script>
