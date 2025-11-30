<template>
  <nav class="shadow-sm border-b">
    <UContainer class="py-4">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-primary-600">
          ✔️ TaskMate
        </NuxtLink>

        <div class="flex items-center space-x-4">
          <!-- Main Navigation -->
          <div class="hidden md:flex items-center space-x-2">
            <!-- Login Button (only when not logged in) -->
            <UButton v-if="!loggedIn" to="/login" variant="outline">
              Login
            </UButton>

            <!-- Student Button (only when logged in and not teacher mode) -->
            <!-- Student dashboard link now points to adaptive home instead of legacy /customer -->
            <UButton v-if="loggedIn && !hasOperatorRole" to="/" variant="ghost">
              Student
            </UButton>

            <!-- Teacher Button (only for users in teacher mode) -->
            <UButton
              v-if="hasOperatorRole"
              to="/teacher/create"
              variant="ghost"
            >
              Teacher
            </UButton>
          </div>

          <!-- User Profile (only when logged in) -->
          <div v-if="loggedIn">
            <UserProfile />
          </div>
        </div>
      </div>
    </UContainer>
  </nav>
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession()

const hasOperatorRole = computed(() => {
  const u = user.value as any
  const roles: string[] = u?.roles || []
  const mode: string = u?.mode || 'student'

  // allow only teachers who are currently in teacher mode
  return roles.includes('teacher') && mode === 'teacher'
})

const modeLabel = computed(() => {
  const mode = (user.value as any)?.mode || 'student'
  return mode.charAt(0).toUpperCase() + mode.slice(1)
})
</script>
