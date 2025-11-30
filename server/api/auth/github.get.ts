export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ['user', 'read:org']
  },
  async onSuccess(event, { user, tokens }) {
    try {
      const safeEmail = user.email ?? `${user.id}@users.noreply.github.com`
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
          email: safeEmail,
          avatar: user.avatar_url,
          provider: 'github',
          organizations,
          roles: normalizedRoles,
          mode: roles.includes('teacher') ? 'teacher' : 'student'
        },
        loggedInAt: Date.now()
      })

      try {
        const { getCollections } = await import('../../utils/mongo')
        const { students, teachers } = await getCollections()
        const now = new Date().toISOString()
        await students.updateOne(
          { email: safeEmail },
          { $set: { name: user.name || user.login, email: safeEmail, avatar: user.avatar_url, provider: 'github', roles: normalizedRoles, mode: roles.includes('teacher') ? 'teacher' : 'student', updatedAt: now }, $setOnInsert: { createdAt: now } },
          { upsert: true }
        )
        if (normalizedRoles.includes('teacher')) {
          await teachers.updateOne(
            { email: safeEmail },
            { $set: { name: user.name || user.login, email: safeEmail, avatar: user.avatar_url, provider: 'github', roles: normalizedRoles, updatedAt: now }, $setOnInsert: { createdAt: now } },
            { upsert: true }
          )
        }
      } catch (dbErr) {
        console.warn('Failed to persist user to DB:', dbErr)
      }

      return sendRedirect(event, '/')
    } catch (error) {
      console.error('Error fetching GitHub user data:', error)
      await setUserSession(event, {
        user: {
          id: user.id.toString(),
          name: user.name || user.login,
          email: user.email,
          avatar: user.avatar_url,
          provider: 'github',
          organizations: [],
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

  if (organizations.some(org => org.toLowerCase().includes('to-do-app'))) {
    roles.push('teacher')
  }

  return roles
}
