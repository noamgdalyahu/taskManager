import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { keys } from './queryKeys'
import type { PlanComparisonDto, PlanJobDto } from './types'

/** Starts a background planning job. The server answers 202 immediately; the plan arrives later (see `usePlanJob`). */
export function useStartPlan(sprintId: string) {
  return useMutation({
    mutationFn: (strategy: 'Hungarian' | 'Greedy' = 'Hungarian') =>
      http<PlanJobDto>(`/sprints/${sprintId}/plan`, { method: 'POST', body: { strategy } }),
  })
}

const isRunning = (job: PlanJobDto | undefined) => job?.status === 'Queued' || job?.status === 'Running'

/** Polls a job until it finishes. Polling stops by itself; no timers to clean up. */
export function usePlanJob(jobId: string | undefined) {
  return useQuery({
    queryKey: keys.planJob(jobId ?? ''),
    queryFn: ({ signal }) => http<PlanJobDto>(`/plan-jobs/${jobId}`, { signal }),
    enabled: !!jobId,
    refetchInterval: (query) => (isRunning(query.state.data) ? 400 : false),
  })
}

export function useAcceptPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => http<PlanJobDto>(`/plan-jobs/${jobId}/accept`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function usePlanComparison(sprintId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: keys.comparison(sprintId ?? ''),
    queryFn: ({ signal }) => http<PlanComparisonDto>(`/sprints/${sprintId}/plan-comparison`, { signal }),
    enabled: enabled && !!sprintId,
  })
}
