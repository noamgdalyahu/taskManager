import { TASK_STATUSES, TASK_TYPES, TASK_TYPE_LABEL, type TaskDto, type TaskStatus } from '@/api/types'

export interface Lane {
  key: string
  title: string
  tasks: TaskDto[]
  byStatus: Record<TaskStatus, TaskDto[]>
  totalHours: number
  hoursByStatus: Record<TaskStatus, number>
}

/** How the board's swimlanes are formed. Work items have no parent story, so the choices are their type, their assignee, or one lane. */
export type LaneGrouping = 'type' | 'assignee' | 'none'

export const GROUPING_LABEL: Record<LaneGrouping, string> = { type: 'Group by Type', assignee: 'Group by Assignee', none: 'No grouping' }

/** The key of the lane that holds work with no type or no assignee, shown last. */
export const NO_TYPE_KEY = ''

export function laneKeyOf(task: TaskDto, grouping: LaneGrouping = 'type'): string {
  if (grouping === 'assignee') return task.assigneeId ?? NO_TYPE_KEY
  if (grouping === 'none') return 'all'
  return task.type ?? NO_TYPE_KEY
}

const emptyByStatus = <T,>(make: () => T) => Object.fromEntries(TASK_STATUSES.map((status) => [status, make()])) as Record<TaskStatus, T>

const TYPE_ORDER = new Map<string, number>(TASK_TYPES.map((type, index) => [type, index]))

/**
 * Groups tasks into lanes. By type: in the order the types are offered, untyped last. By assignee: by name, unassigned
 * last. No grouping: a single lane. Lanes without tasks never exist. `nameOf` turns a member id into the lane's title.
 */
export function buildLanes(tasks: TaskDto[], grouping: LaneGrouping = 'type', nameOf: (memberId: string) => string = () => 'Unknown'): Lane[] {
  const titleOf = (task: TaskDto) => {
    if (grouping === 'assignee') return task.assigneeId ? nameOf(task.assigneeId) : 'Unassigned'
    if (grouping === 'none') return 'All work items'
    return task.type ? TASK_TYPE_LABEL[task.type] : 'No type'
  }

  const lanes = new Map<string, Lane>()
  for (const task of tasks) {
    const key = laneKeyOf(task, grouping)
    let lane = lanes.get(key)
    if (!lane) {
      lane = { key, title: titleOf(task), tasks: [], byStatus: emptyByStatus<TaskDto[]>(() => []), totalHours: 0, hoursByStatus: emptyByStatus(() => 0) }
      lanes.set(key, lane)
    }
    lane.tasks.push(task)
    lane.byStatus[task.status].push(task)
    lane.totalHours += task.estimateHours
    lane.hoursByStatus[task.status] += task.estimateHours
  }

  const ordered = [...lanes.values()]
  if (grouping === 'type') {
    const rank = (key: string) => TYPE_ORDER.get(key) ?? Number.MAX_SAFE_INTEGER
    return ordered.sort((a, b) => rank(a.key) - rank(b.key))
  }
  if (grouping === 'assignee') return ordered.sort((a, b) => (a.key === NO_TYPE_KEY ? 1 : b.key === NO_TYPE_KEY ? -1 : a.title.localeCompare(b.title)))
  return ordered
}

export function sumHours(tasks: TaskDto[]): number {
  return tasks.reduce((sum, task) => sum + task.estimateHours, 0)
}
