export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['user', 'read:org']
  },
  async onSuccess(event, { user, tokens }) {
    try {
      // Fetch user's organization memberships from GitHub API
      const orgsResponse = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.github+json',
        }
      })

      let organizations: string[] = []
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        organizations = orgsData.map((org: any) => org.login)
      } else {
        console.warn('Failed to fetch GitHub organizations:', orgsResponse.status)
      }

      const roles = determineRoles(organizations)
      // normalize roles: dedupe (case-insensitive) and preserve first-seen casing
      const seen = new Set<string>()
      const normalizedRoles: string[] = []
      for (const r of roles) {
        const lc = String(r).toLowerCase()
        if (!seen.has(lc)) {
          seen.add(lc)
          normalizedRoles.push(r)
        }
      }
      await setUserSession(event, {
        user: {
          id: user.id.toString(),
          name: user.name || user.login,
          email: user.email,
          avatar: user.avatar_url,
          provider: 'github',
          organizations,
          roles: normalizedRoles,
          mode: roles.includes('teacher') ? 'teacher' : 'student'
        },
        loggedInAt: Date.now()
      })

      // Upsert the user into the DB so we track their info and roles
      try {
        const { getCollections } = await import('../../utils/mongo')
        const { students, teachers } = await getCollections()
        const now = new Date().toISOString()
        await students.updateOne(
          { email: user.email },
          { $set: { name: user.name || user.login, email: user.email, avatar: user.avatar_url, provider: 'github', roles: normalizedRoles, mode: roles.includes('teacher') ? 'teacher' : 'student', updatedAt: now }, $setOnInsert: { createdAt: now } },
          { upsert: true }
        )
        if (normalizedRoles.includes('teacher')) {
          await teachers.updateOne(
            { email: user.email },
            { $set: { name: user.name || user.login, email: user.email, avatar: user.avatar_url, provider: 'github', roles: normalizedRoles, updatedAt: now }, $setOnInsert: { createdAt: now } },
            { upsert: true }
          )
        }
      } catch (dbErr) {
        // Don't block login if DB upsert fails; log and continue
        console.warn('Failed to persist user to DB:', dbErr)
      }

      return sendRedirect(event, '/')
    } catch (error) {
      console.error('Error fetching GitHub user data:', error)
      // Fallback without organizations/teams
      await setUserSession(event, {
        user: {
          id: user.id.toString(),
          name: user.name || user.login,
          email: user.email,
          avatar: user.avatar_url,
          provider: 'github',
          organizations: [],
          teams: [],
          roles: ['student'],
          mode: 'student'
        },
        loggedInAt: Date.now()
      })

      return sendRedirect(event, '/')
    }
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=github_auth_failed')
  }
})

function determineRoles(organizations: string[]): string[] {
  const roles = ['student']

  if (organizations.some(org => org.toLowerCase().includes('to-do-app') || org.toLowerCase().includes('todo-app') || org.toLowerCase().includes('to_do_app'))) {
    roles.push('teacher')
  }

  return roles
}
