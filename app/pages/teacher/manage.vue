<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">Class Management (Roster)</h1>
      </template>
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold">Roster</h2>
          <UButton
            :disabled="loading"
            :loading="loading"
            icon="i-heroicons-arrow-path"
            variant="soft"
            size="sm"
            @click="load()"
          >
            Refresh
          </UButton>
        </div>
        <form @submit.prevent="add" class="flex flex-col md:flex-row flex-wrap gap-4">
          <UInput v-model="newStudent.name" placeholder="Student name" class="md:flex-1" />
          <UInput v-model="newStudent.email" placeholder="Student email" class="md:flex-1" />
          <UButton
            type="submit"
            :loading="adding"
            :disabled="!newStudent.name || !newStudent.email"
            icon="i-heroicons-plus-circle"
            class="shrink-0"
          >
            Add Student
          </UButton>
        </form>
        <UTable :data="students" :columns="columns" :loading="loading">
          <template #cell-action="{ row }">
            <UButton color="error" variant="ghost" size="xs" @click="remove(row.original.email)">Remove</UButton>
          </template>
        </UTable>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ auth: true })
const students = ref<any[]>([])
const loading = ref(false)
const adding = ref(false)
const newStudent = reactive({ name: '', email: '' })
// Manual refresh only; removed interval auto-refresh

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { id: 'action', header: 'Action' }
]

async function load() {
  if (loading.value) return
  loading.value = true
  try {
    students.value = await $fetch('/api/teacher/manage')
  } catch (err) {
    console.error('Failed to load class roster', err)
  } finally {
    loading.value = false
  }
}

async function add() {
  if (!newStudent.name || !newStudent.email) return
  adding.value = true
  try {
    await $fetch('/api/teacher/manage', { method: 'POST', body: { name: newStudent.name, email: newStudent.email } })
    newStudent.name = ''
    newStudent.email = ''
    await load()
  } catch (err) {
    console.error('Failed to add student', err)
  } finally {
    adding.value = false
  }
}

async function remove(email: string) {
  try {
    await $fetch(`/api/teacher/manage/${email}`, { method: 'DELETE' })
    await load()
  } catch (err) {
    console.error('Failed to remove student', err)
  }
}

onMounted(load)
</script>