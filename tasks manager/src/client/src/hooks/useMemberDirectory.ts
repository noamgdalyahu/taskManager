import { useMemo } from 'react'
import { useTeam } from '@/api/projects'
import type { TeamMemberDto } from '@/api/types'

/** The project's people, indexed by id, so any row can show "Dana" for an assignee id without another request. */
export function useMemberDirectory(projectId: string | undefined) {
  const query = useTeam(projectId)
  return useMemo(() => {
    const members = query.data ?? []
    const byId = new Map<string, TeamMemberDto>(members.map((m) => [m.id, m]))
    return { members, byId, isLoading: query.isLoading }
  }, [query.data, query.isLoading])
}
