<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <UCard>
        <template #header>
          <h1 class="text-2xl font-bold">User Profile</h1>
        </template>

        <div class="space-y-6">
          <!-- Avatar and Basic Info -->
          <div class="flex items-center space-x-4">
            <UAvatar
              :src="(user as any)?.avatar"
              :alt="(user as any)?.name"
              size="xl"
            />
            <div>
              <h2 class="text-xl font-semibold">{{ (user as any)?.name }}</h2>
              <p class="text-gray-600">{{ (user as any)?.email }}</p>
              <UBadge :label="(user as any)?.provider" variant="soft" class="mt-1" />
            </div>
          </div>

          <!-- Account Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="User ID">
              <UInput :value="(user as any)?.id" readonly />
            </UFormField>

            <UFormField label="Provider">
              <UInput :value="(user as any)?.provider" readonly />
            </UFormField>

            <UFormField label="Name">
              <UInput :value="(user as any)?.name" readonly />
            </UFormField>

            <UFormField label="Email">
              <UInput :value="(user as any)?.email" readonly />
            </UFormField>

            <UFormField label="Roles">
              <UInput :value="(user as any)?.roles?.join(', ') || 'user'" readonly />
            </UFormField>

            <UFormField label="Repository Access" v-if="(user as any)?.repository">
              <UInput :value="(user as any)?.repository" readonly />
            </UFormField>

            <UFormField label="Access Level" v-if="(user as any)?.accessLevel">
              <UInput :value="(user as any)?.accessLevel" readonly />
            </UFormField>
          </div>

          <!-- Session Information -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium mb-4">Session Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Logged in at">
                <UInput :value="formattedLoginTime" readonly />
              </UFormField>

              <UFormField label="Session status">
                <UBadge label="Active" color="success" variant="soft" />
              </UFormField>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              variant="outline"
              @click="navigateTo('/')"
            >
              Back to Home
            </UButton>

            <UButton
              color="error"
              variant="outline"
              @click="logout"
            >
              Sign Out
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Profile'
})

const { user, session } = useUserSession()

const formattedLoginTime = computed(() => {
  const loginTime = (session.value as any)?.loggedInAt
  if (loginTime && typeof loginTime === 'number') {
    return new Date(loginTime).toLocaleString()
  }
  return 'Unknown'
})

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    // Force a full page refresh to clear all session state
    window.location.href = '/'
  } catch (error) {
    console.error('Logout error:', error)
    // Even if logout fails, redirect to clear UI state
    window.location.href = '/'
  }
}
</script>
