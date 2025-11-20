export default defineEventHandler(async () => {
  // Check if CI/CD test password is configured at runtime
  const cicdPassword = process.env.NUXT_CICD_TEST_PASSWORD

  return {
    enabled: !!cicdPassword
  }
})
