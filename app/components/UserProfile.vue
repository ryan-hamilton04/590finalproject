<template>
  <UPopover>
    <UButton
      variant="ghost"
      class="flex items-center space-x-2"
    >
      <UAvatar
        :src="(user as any)?.avatar"
        :alt="(user as any)?.name"
        size="sm"
      />
      <span class="hidden sm:block">{{ (user as any)?.name }}</span>
      <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4" />
    </UButton>

    <template #content>
      <div class="p-4 w-48">
        <div class="space-y-1">
          <!-- User Info -->
          <div class="px-2 py-1 text-sm text-gray-500 border-b border-gray-200">
            {{ (user as any)?.email }}
          </div>

          <!-- Menu Items -->
          <UButton
            variant="ghost"
            class="w-full justify-start"
            @click="navigateTo('/profile')"
          >
            <UIcon name="i-heroicons-user-circle" class="w-4 h-4 mr-2" />
            Profile
          </UButton>



          <div class="border-t border-gray-200 pt-1">
            <UButton
              variant="ghost"
              class="w-full justify-start text-red-600"
              @click="logout"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
              Sign out
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const { user } = useUserSession()

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
