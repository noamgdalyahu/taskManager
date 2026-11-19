import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

/** "/" has no screen of its own: managers land on their projects, members on their work. */
export function HomeRedirect() {
  const { isManager } = useAuth()
  return <Navigate to={isManager ? '/projects' : '/me/tasks'} replace />
}
