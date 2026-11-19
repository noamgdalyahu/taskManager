import { useParams } from 'react-router-dom'

/** The ids in the URL of any `/p/:projectId/...` screen. The router guarantees projectId, so this never returns undefined for it. */
export function useProjectParams(): { projectId: string; sprintId: string | undefined; taskId: string | undefined } {
  const { projectId, sprintId, taskId } = useParams()
  if (!projectId) throw new Error('useProjectParams used outside a /p/:projectId route')
  return { projectId, sprintId, taskId }
}
