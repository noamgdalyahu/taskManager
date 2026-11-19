import { createContext, useContext } from 'react'
import type { Role, UserDto } from '@/api/types'

export interface AuthValue {
  user: UserDto | null
  isManager: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { email: string; password: string; name: string; role: Role }) => Promise<void>
  logout: () => void
  /** Replace the cached user after a profile edit. */
  updateUser: (user: UserDto) => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** For screens that only render when signed in. */
export function useCurrentUser(): UserDto {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser called while signed out')
  return user
}
