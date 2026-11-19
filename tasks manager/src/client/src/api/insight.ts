import { useQuery } from '@tanstack/react-query'
import { http } from './http'
import { keys } from './queryKeys'
import type { BoardDto, DashboardDto, ReportsDto } from './types'

export function useBoard(sprintId: string | undefined) {
  return useQuery({
    queryKey: keys.board(sprintId ?? ''),
    queryFn: ({ signal }) => http<BoardDto>(`/sprints/${sprintId}/board`, { signal }),
    enabled: !!sprintId,
  })
}

/** Managers only; pass `enabled: false` for members so no doomed request is made. */
export function useDashboard(sprintId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: keys.dashboard(sprintId ?? ''),
    queryFn: ({ signal }) => http<DashboardDto>(`/sprints/${sprintId}/dashboard`, { signal }),
    enabled: enabled && !!sprintId,
  })
}

export function useReports(projectId: string | undefined) {
  return useQuery({
    queryKey: keys.reports(projectId ?? ''),
    queryFn: ({ signal }) => http<ReportsDto>(`/projects/${projectId}/reports`, { signal }),
    enabled: !!projectId,
  })
}
