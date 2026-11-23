import type { UserDto } from '@/api/types'

/**
 * The signed-in session, kept as a tiny external store instead of React state. That matters: the HTTP layer needs the
 * token before any component renders, and React runs child effects before parent effects, so a provider that
 * "configures http in an effect" would let the first requests go out without it.
 *
 * Storage note: the JWT lives in localStorage so a refresh keeps you signed in. That is readable by any script on this
 * origin (XSS), which is why the app renders no raw HTML and the token is short lived (two hours, renewed while the app is open).
 */
export interface Session {
  token: string
  expiresAt: string
  user: UserDto
}

const KEY = 'sm.session'
const listeners = new Set<() => void>()

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    return Date.parse(session.expiresAt) > Date.now() ? session : null
  } catch {
    return null
  }
}

let current: Session | null = load()

export function getSession(): Session | null {
  return current
}

export function setSession(next: Session | null): void {
  current = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    // private mode or blocked storage: the session simply lasts until the tab closes
  }
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
