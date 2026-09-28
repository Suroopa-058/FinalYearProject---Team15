import type { AuthSession } from './api'

const AUTH_SESSION_KEY = 'scholarmatch.auth.session'

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(AUTH_SESSION_KEY)
  if (!stored) return null

  try {
    const session = JSON.parse(stored) as AuthSession
    const [encodedPayload] = session.token.split('.')
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(window.atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '='))) as { exp?: number }
    if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
      window.localStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }
    return session
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function setStoredSession(session: AuthSession): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  }
}

export function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_SESSION_KEY)
  }
}
