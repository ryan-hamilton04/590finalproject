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

            <!-- Customer Button (only when logged in) -->
            <UButton v-if="loggedIn" to="/customer" variant="ghost">
              Customer
            </UButton>

            <!-- Operator Button (only for users with operator role) -->
            <UButton
              v-if="hasOperatorRole"
              to="/operator"
              variant="ghost"
            >
              Operator
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
  return (user.value as any)?.roles?.includes('operator') || false
})
</script>
