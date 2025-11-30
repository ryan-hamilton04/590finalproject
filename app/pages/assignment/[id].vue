<template>
  <UContainer class="py-8" v-if="ready">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">{{ assignment?.title }}</h1>
        <p class="text-gray-600">Due {{ formatDateToYMD(assignment?.dueDate) }} · {{ assignment?.teacherName }}</p>
      </template>
      <div class="space-y-4">
        <p class="text-gray-700">{{ assignment?.description }}</p>

        <div class="flex items-center gap-4">
          <USelect :items="statuses" v-model="status" />
          <UButton :loading="saving" @click="save">Save Status</UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
  <UContainer v-else class="py-8">
    <USkeleton class="h-40" />
  </UContainer>
</template>

<script setup lang="ts">
import { formatDateToYMD } from '../../../server/utils/format'

definePageMeta({ auth: true })

const route = useRoute()
const id = route.params.id as string
const assignment = ref<any>(null)
const status = ref('need to do')
const statuses = ['need to do', 'in progress', 'complete']
const ready = ref(false)
const saving = ref(false)

async function load() {
  try {
    const data = await $fetch(`/api/student/assignments/${id}`)
    assignment.value = data
    status.value = data?.submission?.status || 'need to do'
  } catch (err) {
    console.error('Failed to load assignment detail', err)
  } finally {
    ready.value = true
  }
}

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/student/assignments/${id}/submit`, { method: 'POST', body: { status: status.value } })
    await load()
  } catch (err) {
    console.error('Failed to update status', err)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>