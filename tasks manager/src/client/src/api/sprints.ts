import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { keys } from './queryKeys'
import type { SprintDto, SprintRequest } from './types'

export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: keys.sprints(projectId ?? ''),
    queryFn: ({ signal }) => http<SprintDto[]>(`/projects/${projectId}/sprints`, { signal }),
    enabled: !!projectId,
  })
}

/** The sprints of several projects at once (parallel requests), for screens that must look across all of a person's projects. */
export function useSprintsOfProjects(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: keys.sprints(projectId),
      queryFn: ({ signal }: { signal: AbortSignal }) => http<SprintDto[]>(`/projects/${projectId}/sprints`, { signal }),
    })),
  })
}

export function useSprint(sprintId: string | undefined) {
  return useQuery({
    queryKey: keys.sprint(sprintId ?? ''),
    queryFn: ({ signal }) => http<SprintDto>(`/sprints/${sprintId}`, { signal }),
    enabled: !!sprintId,
  })
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SprintRequest) => http<SprintDto>(`/projects/${projectId}/sprints`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sprints(projectId) }),
  })
}

/** Planned → Active → Closed. The server refuses any other move. */
export function useSprintTransition(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { sprintId: string; to: 'start' | 'close' }) =>
      http<SprintDto>(`/sprints/${input.sprintId}/${input.to}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sprints(projectId) }),
  })
}
