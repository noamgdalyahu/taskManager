import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TaskDto } from '@/api/types'

export interface BoardFilter {
  keyword: string
  /** Member ids, or "none" for unassigned. */
  assignees: string[]
  tags: string[]
}

export const UNASSIGNED = 'none'

/**
 * The board filter lives in the URL (as in Azure Boards), so a filtered view can be bookmarked or sent to a colleague,
 * and survives a refresh. Typing replaces the history entry instead of adding one per keystroke.
 */
export function useBoardFilter() {
  const [params, setParams] = useSearchParams()

  const filter = useMemo<BoardFilter>(
    () => ({ keyword: params.get('q') ?? '', assignees: params.getAll('assignee'), tags: params.getAll('tag') }),
    [params],
  )

  const setFilter = (next: BoardFilter) => {
    const updated = new URLSearchParams()
    if (next.keyword) updated.set('q', next.keyword)
    next.assignees.forEach((id) => updated.append('assignee', id))
    next.tags.forEach((tag) => updated.append('tag', tag))
    setParams(updated, { replace: true })
  }

  const activeCount = (filter.keyword ? 1 : 0) + filter.assignees.length + filter.tags.length
  return { filter, setFilter, activeCount }
}

/** Keyword matches the title; assignees and tags each match if ANY chosen value fits; all active parts must hold. */
export function matchesFilter(task: TaskDto, filter: BoardFilter): boolean {
  if (filter.keyword && !task.title.toLowerCase().includes(filter.keyword.trim().toLowerCase())) return false
  if (filter.assignees.length > 0 && !filter.assignees.includes(task.assigneeId ?? UNASSIGNED)) return false
  if (filter.tags.length > 0 && !task.requiredSkills.some((skill) => filter.tags.includes(skill))) return false
  return true
}
