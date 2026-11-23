import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TaskDto, TaskType } from '@/api/types'

export interface BoardFilter {
  keyword: string
  /** Member ids, or "none" for unassigned. */
  assignees: string[]
  /** Task types; a task matches if its type is any of them. */
  types: TaskType[]
}

export const UNASSIGNED = 'none'

/**
 * The board filter lives in the URL (as in Azure Boards), so a filtered view can be bookmarked or sent to a colleague,
 * and survives a refresh. Typing replaces the history entry instead of adding one per keystroke.
 */
export function useBoardFilter() {
  const [params, setParams] = useSearchParams()

  const filter = useMemo<BoardFilter>(
    () => ({ keyword: params.get('q') ?? '', assignees: params.getAll('assignee'), types: params.getAll('type') as TaskType[] }),
    [params],
  )

  const setFilter = (next: BoardFilter) => {
    const updated = new URLSearchParams()
    if (next.keyword) updated.set('q', next.keyword)
    next.assignees.forEach((id) => updated.append('assignee', id))
    next.types.forEach((type) => updated.append('type', type))
    setParams(updated, { replace: true })
  }

  const activeCount = (filter.keyword ? 1 : 0) + filter.assignees.length + filter.types.length
  return { filter, setFilter, activeCount }
}

/** Keyword matches the title; assignees and types each match if ANY chosen value fits; all active parts must hold. */
export function matchesFilter(task: TaskDto, filter: BoardFilter): boolean {
  if (filter.keyword && !task.title.toLowerCase().includes(filter.keyword.trim().toLowerCase())) return false
  if (filter.assignees.length > 0 && !filter.assignees.includes(task.assigneeId ?? UNASSIGNED)) return false
  if (filter.types.length > 0 && !(task.type && filter.types.includes(task.type))) return false
  return true
}
