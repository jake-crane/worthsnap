export interface CurrentUser {
  id: number
  name: string | null
  email: string | null
  avatarUrl: string | null
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Checks session state without the generic API client's redirect-on-401 behavior, since a 401
 * here just means "not logged in yet" rather than a session that expired mid-use.
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch('/api/me')
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function logout(): Promise<void> {
  const csrfToken = getCookie('XSRF-TOKEN')
  await fetch('/logout', {
    method: 'POST',
    headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
  })
  window.location.href = '/'
}
