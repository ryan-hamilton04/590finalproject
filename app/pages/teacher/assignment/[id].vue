<template>
  <UContainer class="py-8" v-if="ready">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-2">
          <h1 class="text-2xl font-bold">Status: {{ assignmentForm.title }}</h1>
          <p class="text-gray-600">Due {{ formatDateToYMD(assignmentForm.dueDate) }}</p>
          <UButton size="sm" variant="soft" icon="i-heroicons-pencil-square" @click="toggleEdit">
            {{ editing ? 'Cancel Edit' : 'Edit Assignment' }}
          </UButton>
        </div>
      </template>
      <div v-if="editing" class="mb-8 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Title</label>
          <UInput v-model="assignmentForm.title" placeholder="Title" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <UTextarea v-model="assignmentForm.description" :rows="4" placeholder="Description" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Due Date</label>
          <UInput type="date" v-model="assignmentForm.dueDateYMD" />
        </div>
        <div class="flex gap-2">
          <UButton :loading="saving" icon="i-heroicons-check" @click="save" :disabled="!assignmentForm.title || !assignmentForm.dueDateYMD">Save Changes</UButton>
          <UButton variant="outline" color="neutral" icon="i-heroicons-x-mark" @click="toggleEdit">Cancel</UButton>
        </div>
        <UDivider label="Current Statuses" />
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div>
          <h2 class="font-semibold mb-2">Need To Do</h2>
          <div class="space-y-2">
            <div v-for="s in groups.needToDo" :key="s.email" class="p-2 rounded bg-yellow-50 border border-yellow-200 text-sm">{{ s.name }}</div>
            <p v-if="!groups.needToDo.length" class="text-xs text-gray-500">None</p>
          </div>
        </div>
        <div>
          <h2 class="font-semibold mb-2">In Progress</h2>
          <div class="space-y-2">
            <div v-for="s in groups.inProgress" :key="s.email" class="p-2 rounded bg-blue-50 border border-blue-200 text-sm">{{ s.name }}</div>
            <p v-if="!groups.inProgress.length" class="text-xs text-gray-500">None</p>
          </div>
        </div>
        <div>
          <h2 class="font-semibold mb-2">Complete</h2>
          <div class="space-y-2">
            <div v-for="s in groups.complete" :key="s.email" class="p-2 rounded bg-green-50 border border-green-200 text-sm">{{ s.name }}</div>
            <p v-if="!groups.complete.length" class="text-xs text-gray-500">None</p>
          </div>
        </div>
      </div>
    </UCard>
  </UContainer>
  <UContainer v-else class="py-8">
    <USkeleton class="h-40" />
  </UContainer>
</template>

<script setup lang="ts">
import { formatDateToYMD } from '../../../../server/utils/format'
definePageMeta({ auth: true })
const route = useRoute()
const id = route.params.id as string
const assignment = ref<any>(null)
const assignmentForm = reactive<{ title: string; description: string; dueDate: Date | null; dueDateYMD: string }>(
  { title: '', description: '', dueDate: null, dueDateYMD: '' }
)
const groups = reactive({ needToDo: [] as any[], inProgress: [] as any[], complete: [] as any[] })
const ready = ref(false)
const editing = ref(false)
const saving = ref(false)

function toggleEdit() {
  if (editing.value) {
    // revert form to assignment data
    if (assignment.value) hydrateForm(assignment.value)
    editing.value = false
  } else {
    editing.value = true
  }
}

function hydrateForm(a: any) {
  assignmentForm.title = a.title || ''
  assignmentForm.description = a.description || ''
  assignmentForm.dueDate = a.dueDate ? new Date(a.dueDate) : null
  assignmentForm.dueDateYMD = assignmentForm.dueDate ? assignmentForm.dueDate.toISOString().substring(0,10) : ''
}

async function save() {
  if (!assignment.value) return
  saving.value = true
  try {
    await $fetch(`/api/teacher/assignments/${id}`, { method: 'PUT', body: {
      title: assignmentForm.title,
      description: assignmentForm.description,
      dueDate: assignmentForm.dueDateYMD
    } })
    // reload full details & statuses
    await loadDetails()
    await loadStatuses()
    editing.value = false
  } catch (err) {
    console.error('Failed to save assignment', err)
  } finally {
    saving.value = false
  }
}

async function loadDetails() {
  try {
    const data = await $fetch(`/api/teacher/assignments/${id}`)
    assignment.value = data
    hydrateForm(data)
  } catch (err) {
    console.error('Failed to load assignment details', err)
  }
}

async function loadStatuses() {
  try {
    const data = await $fetch(`/api/teacher/assignments/${id}/submissions`)
    groups.needToDo = data.groups.needToDo
    groups.inProgress = data.groups.inProgress
    groups.complete = data.groups.complete
  } catch (err) {
    console.error('Failed to load assignment status', err)
  }
}

onMounted(async () => {
  await loadDetails()
  await loadStatuses()
  ready.value = true
})
</script>