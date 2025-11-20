export default defineOAuthGitLabEventHandler({
  config: {
    scope: ['read_user', 'read_api'],
  },
  async onSuccess(event, { user, tokens }) {
    try {
      const config = useRuntimeConfig()
      const gitlabUrl = config.oauth?.gitlab?.baseURL || 'https://gitlab.com'

      // Fetch user groups from GitLab API
      const groupsResponse = await fetch(`${gitlabUrl}/api/v4/groups?membership=true&min_access_level=10`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      let groups: string[] = []
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        groups = groupsData.map((group: any) => group.full_path)
      } else {
        console.warn('Failed to fetch GitLab groups:', groupsResponse.status)
      }

      await setUserSession(event, {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          provider: 'gitlab',
          groups: groups,
          roles: determineRoles(groups)
        },
        loggedInAt: Date.now()
      })

      return sendRedirect(event, '/')
    } catch (error) {
      console.error('Error fetching GitLab user data:', error)
      // Fallback without groups
      await setUserSession(event, {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          provider: 'gitlab',
          groups: [],
          roles: ['user']
        },
        loggedInAt: Date.now()
      })

      return sendRedirect(event, '/')
    }
  },
  onError(event, error) {
    console.error('GitLab OAuth error:', error)
    return sendRedirect(event, '/login?error=gitlab_auth_failed')
  }
})

function determineRoles(groups: string[]): string[] {
  const roles = ['customer'] // Default role

  if (groups.some(group => group.includes('smoothie-stand'))) {
    roles.push('operator')
  }

  return roles
}
