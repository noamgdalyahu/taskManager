import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { keys } from './queryKeys'
import type { InvitationDto, ProjectDto, ProjectRequest, TeamMemberDto } from './types'

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: [...keys.projects, { includeArchived }],
    queryFn: ({ signal }) => http<ProjectDto[]>(`/projects?includeArchived=${includeArchived}`, { signal }),
  })
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: keys.project(projectId ?? ''),
    queryFn: ({ signal }) => http<ProjectDto>(`/projects/${projectId}`, { signal }),
    enabled: !!projectId,
  })
}

export function useTeam(projectId: string | undefined) {
  return useQuery({
    queryKey: keys.team(projectId ?? ''),
    queryFn: ({ signal }) => http<TeamMemberDto[]>(`/projects/${projectId}/team`, { signal }),
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectRequest) => http<ProjectDto>('/projects', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects }),
  })
}

/** Work-in-progress limits per board column. Missing column = no limit. A limit is a signal (red count), not a lock. */
export function useSetWipLimits(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (limits: Record<string, number>) => http<ProjectDto>(`/projects/${projectId}/wip-limits`, { method: 'PUT', body: { limits } }),
    onSuccess: (project) => {
      qc.setQueryData(keys.project(projectId), project)
      void qc.invalidateQueries({ queryKey: keys.projects })
    },
  })
}

export function useJoinProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => http<ProjectDto>('/projects/join', { method: 'POST', body: { code } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects }),
  })
}

export function useInvite(projectId: string) {
  return useMutation({
    mutationFn: (input: { email?: string; expiresInDays?: number }) =>
      http<InvitationDto>(`/projects/${projectId}/invitations`, { method: 'POST', body: input }),
  })
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => http<ProjectDto>(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.project(projectId) }),
  })
}

/** Rename a project or change its description (managers). */
export function useUpdateProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectRequest) => http<ProjectDto>(`/projects/${projectId}`, { method: 'PUT', body }),
    onSuccess: (project) => {
      qc.setQueryData(keys.project(projectId), project)
      void qc.invalidateQueries({ queryKey: keys.projects })
    },
  })
}

/** Archive a project, or restore it with `archived: false` (managers). The server has no delete. */
export function useArchiveProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (archived: boolean) => http<ProjectDto>(`/projects/${projectId}/archive?archived=${archived}`, { method: 'PATCH' }),
    onSuccess: (project) => {
      qc.setQueryData(keys.project(projectId), project)
      void qc.invalidateQueries({ queryKey: keys.projects })
    },
  })
}
