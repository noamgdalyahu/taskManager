import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

/** Sends signed-out visitors to the login screen and brings them back to where they were going afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}
