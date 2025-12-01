<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to TaskMate
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Choose your authentication method
        </p>
      </div>

      <div class="space-y-4">
        <!-- GitHub OAuth -->
        <UButton
          @click="signInWithGitHub"
          :loading="loading.github"
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center space-x-2"
        >
          <Icon name="i-simple-icons-github" class="w-5 h-5" />
          <span>Continue with GitHub</span>
        </UButton>
      </div>

      <div class="text-center">
        <p class="text-xs text-gray-500">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
  layout: false
})

const { loggedIn } = useUserSession()

const loading = ref({
  github: false,
  gitlab: false,
  demo: false
})

const cicdForm = ref({
  password: ''
})

// Redirect if already logged in
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    navigateTo('/')
  }
}, { immediate: true })

async function signInWithGitHub() {
  loading.value.github = true
  try {
    await navigateTo('/api/auth/github', { external: true })
  } catch (error) {
    console.error('GitHub login error:', error)
  } finally {
    loading.value.github = false
  }
}
</script>
