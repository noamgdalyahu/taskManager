import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { loginRequest, registerRequest } from '@/api/account'
import type { AuthResponse } from '@/api/types'
import { getSession, setSession, subscribeSession, type Session } from '@/auth/session'
import { AuthContext, type AuthValue } from '@/auth/useAuth'

function toSession(response: AuthResponse): Session {
  return { token: response.accessToken, expiresAt: response.expiresAt, user: response.user }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSession)
  const queryClient = useQueryClient()

  // Signing out must also forget every cached answer, or the next person on this browser could see the last one's data.
  useEffect(() => {
    if (!session) queryClient.clear()
  }, [session, queryClient])

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      isManager: session?.user.role === 'Manager',
      login: async (email, password) => setSession(toSession(await loginRequest(email, password))),
      register: async (input) => setSession(toSession(await registerRequest(input))),
      logout: () => setSession(null),
      updateUser: (user) => {
        if (session) setSession({ ...session, user })
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
