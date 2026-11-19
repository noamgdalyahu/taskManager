import { useMemo } from 'react'
import { useSprints } from '@/api/sprints'
import type { SprintDto } from '@/api/types'

/**
 * Which sprint a sprint-scoped screen shows. The URL wins; with no sprint in the URL we pick the one a manager most
 * likely means: the active sprint, otherwise the sprint being planned, otherwise the most recent one.
 */
export function useSprintSelection(projectId: string | undefined, sprintIdFromUrl: string | undefined) {
  const query = useSprints(projectId)
  const sprints = query.data

  const sprint = useMemo<SprintDto | undefined>(() => {
    if (!sprints?.length) return undefined
    return (
      sprints.find((s) => s.id === sprintIdFromUrl) ??
      sprints.find((s) => s.status === 'Active') ??
      sprints.find((s) => s.status === 'Planned') ??
      sprints[0]
    )
  }, [sprints, sprintIdFromUrl])

  return { sprints: sprints ?? [], sprint, isLoading: query.isLoading, error: query.error }
}
