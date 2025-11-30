<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <h1 class="text-2xl font-bold">Create Assignment</h1>
            <p class="text-gray-600 text-sm mt-1">Fill in details and choose assignees.</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500" v-if="students.length">
            <span>Total Students: {{ students.length }}</span>
            <span v-if="!assignAll">• Selected: {{ selectedCount }}</span>
          </div>
        </div>
      </template>

      <form @submit.prevent="submit" class="space-y-8">
        <div class="space-y-10">
          <!-- Details block -->
          <div class="rounded border border-gray-200 bg-white divide-y divide-gray-200">
            <div class="p-5 space-y-2">
              <UFormGroup label="Title" required :error="errors.title">
                <UInput v-model="form.title" placeholder="Title" class="w-full md:w-[36rem]" />
              </UFormGroup>
            </div>
            <div class="p-5 space-y-2">
              <UFormGroup label="Description (optional)">
                <UTextarea v-model="form.description" placeholder="Description" :rows="6" class="w-full md:w-[36rem]" />
              </UFormGroup>
            </div>
            <div class="p-5">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium" for="dueDate">Due Date:</label>
                <UInput id="dueDate" type="date" v-model="form.dueDate" />
              </div>
              <p v-if="errors.dueDate" class="mt-1 text-xs text-red-600">{{ errors.dueDate }}</p>
            </div>
          </div>

          <!-- Assignees block -->
          <div class="space-y-4">
            <UFormGroup label="Assignees" :error="errors.assignees">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <UCheckbox v-model="assignAll" label="All Students" />
                  <UButton size="xs" variant="soft" v-if="!assignAll && selected.length" @click="clearSelection">Clear</UButton>
                </div>
                <div v-if="!assignAll">
                  <div class="max-h-64 overflow-auto border border-gray-200 rounded divide-y divide-gray-100 bg-white">
                    <label v-for="s in students" :key="s.email" class="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                      <div class="flex flex-col">
                        <span class="font-medium">{{ s.name }}</span>
                        <span class="text-xs text-gray-500">{{ s.email }}</span>
                      </div>
                      <input type="checkbox" :value="s.email" v-model="selected" class="h-4 w-4" />
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 mt-2" v-if="!selected.length">Select one or more students, or toggle "All Students".</p>
                </div>
              </div>
            </UFormGroup>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div class="text-xs text-gray-500" v-if="submitError">{{ submitError }}</div>
          <div class="flex gap-4">
            <UButton type="submit" :loading="loading" icon="i-heroicons-check-circle" :disabled="!canSubmit">Create</UButton>
            <UButton variant="ghost" to="/" icon="i-heroicons-arrow-left">Cancel</UButton>
          </div>
        </div>
      </form>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ auth: true })
const loading = ref(false)
const students = ref<any[]>([])
const selected = ref<string[]>([])
const assignAll = ref(true)
const submitError = ref('')

const form = reactive({ title: '', description: '', dueDate: '' })
const errors = reactive<{ title: string; dueDate: string; assignees: string }>({ title: '', dueDate: '', assignees: '' })

const selectedCount = computed(() => selected.value.length)
const canSubmit = computed(() => !!form.title && !!form.dueDate && (assignAll.value || selectedCount.value > 0))

function validate() {
  errors.title = form.title ? '' : 'Title required'
  errors.dueDate = form.dueDate ? '' : 'Due date required'
  errors.assignees = assignAll.value || selectedCount.value > 0 ? '' : 'Select at least one student or use All Students'
  return !errors.title && !errors.dueDate && !errors.assignees
}

function clearSelection() {
  selected.value = []
}

async function loadStudents() {
  try {
    students.value = await $fetch<any[]>('/api/teacher/manage')
  } catch (err) {
    console.error('Failed to load students', err)
  }
}

async function submit() {
  submitError.value = ''
  if (!validate()) {
    submitError.value = 'Please fix validation errors before submitting.'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/teacher/assignments', {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        assigneeEmails: assignAll.value ? [] : selected.value,
        allStudents: assignAll.value
      }
    })
    navigateTo('/')
  } catch (err: any) {
    console.error('Failed to create assignment', err)
    submitError.value = err?.data?.statusMessage || 'Creation failed.'
  } finally {
    loading.value = false
  }
}

watch([() => form.title, () => form.dueDate, assignAll, selected], () => {
  // live validation without blocking typing
  validate()
})

onMounted(loadStudents)
</script>