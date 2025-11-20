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

        <!-- GitLab OAuth -->
        <UButton
          @click="signInWithGitLab"
          :loading="loading.gitlab"
          block
          size="lg"
          variant="outline"
          class="flex items-center justify-center space-x-2"
        >
          <Icon name="i-simple-icons-gitlab" class="w-5 h-5" />
          <span>Continue with GitLab</span>
        </UButton>

        <!-- CI/CD Test Login (for development/testing) -->
        <template v-if="cicdTestEnabled">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">Or for testing</span>
            </div>
          </div>

          <UForm :state="cicdForm" @submit="signInDemo" class="space-y-4">
            <UFormField label="CI/CD Test Password" name="password">
              <UInput
                v-model="cicdForm.password"
                placeholder="Enter CI/CD test password"
              />
            </UFormField>

            <UButton
              type="submit"
              :loading="loading.demo"
              block
              size="lg"
              color="primary"
            >
              CI/CD Test Login
            </UButton>
          </UForm>
        </template>
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

// Check if CI/CD test login is enabled by querying the server
const { data: demoStatus } = await useFetch('/api/auth/demo')
const cicdTestEnabled = computed(() => demoStatus.value?.enabled ?? false)

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

async function signInWithGitLab() {
  loading.value.gitlab = true
  // window.location.href = "/api/auth/gitlab"
  try {
    await navigateTo('/api/auth/gitlab', { external: true })
  } catch (error) {
    console.error('GitLab login error:', error)
  } finally {
    loading.value.gitlab = false
  }
}

async function signInDemo() {
  loading.value.demo = true
  try {
    const { data } = await $fetch('/api/auth/demo', {
      method: 'POST',
      body: {
        password: cicdForm.value.password
      }
    })

    if (data) {
      // Force a full page refresh to update session state
      window.location.href = '/'
    }
  } catch (error: any) {
    console.error('CI/CD test login error:', error)
    // Show error message to user
    alert(error?.data?.statusMessage || 'Login failed. Please check your password.')
    loading.value.demo = false
  }
}
</script>
