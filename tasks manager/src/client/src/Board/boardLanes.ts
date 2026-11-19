import { TASK_STATUSES, TASK_TYPES, TASK_TYPE_LABEL, type TaskDto, type TaskStatus } from '@/api/types'

export interface Lane {
  key: string
  title: string
  tasks: TaskDto[]
  byStatus: Record<TaskStatus, TaskDto[]>
  totalHours: number
  hoursByStatus: Record<TaskStatus, number>
}

/** Tasks have no parent story, so a lane is the task's type. Tasks created before types existed share the last lane. */
export const NO_TYPE_KEY = ''

export function laneKeyOf(task: TaskDto): string {
  return task.type ?? NO_TYPE_KEY
}

const emptyByStatus = <T,>(make: () => T) => Object.fromEntries(TASK_STATUSES.map((status) => [status, make()])) as Record<TaskStatus, T>

const ORDER = new Map<string, number>(TASK_TYPES.map((type, index) => [type, index]))

/** Groups tasks into lanes in the order the types are offered, untyped last. Lanes without tasks never exist. */
export function buildLanes(tasks: TaskDto[]): Lane[] {
  const lanes = new Map<string, Lane>()
  for (const task of tasks) {
    const key = laneKeyOf(task)
    let lane = lanes.get(key)
    if (!lane) {
      lane = { key, title: task.type ? TASK_TYPE_LABEL[task.type] : 'No type', tasks: [], byStatus: emptyByStatus<TaskDto[]>(() => []), totalHours: 0, hoursByStatus: emptyByStatus(() => 0) }
      lanes.set(key, lane)
    }
    lane.tasks.push(task)
    lane.byStatus[task.status].push(task)
    lane.totalHours += task.estimateHours
    lane.hoursByStatus[task.status] += task.estimateHours
  }
  const rank = (key: string) => ORDER.get(key) ?? Number.MAX_SAFE_INTEGER
  return [...lanes.values()].sort((a, b) => rank(a.key) - rank(b.key))
}

export function sumHours(tasks: TaskDto[]): number {
  return tasks.reduce((sum, task) => sum + task.estimateHours, 0)
}
