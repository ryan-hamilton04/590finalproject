export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  // Check if the route requires authentication
  const requiresAuth = to.meta.auth !== false

  // If route requires auth and user is not logged in, redirect to login
  if (requiresAuth && !loggedIn.value) {
    return navigateTo('/login')
  }

  // If user is logged in and trying to access login page, redirect to home
  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/')
  }
})
