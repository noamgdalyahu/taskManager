import Box from '@mui/material/Box'
import type { DashboardDto, SprintDto, TaskDto } from '@/api/types'
import { StatCard } from '@/common/StatCard/StatCard'
import { formatDay, formatHours } from '@/lib/format'

interface KpiRowProps {
  dashboard: DashboardDto
  sprint: SprintDto
  /** Every task of the sprint. */
  tasks: TaskDto[]
}

/** The four numbers a manager reads first: tasks, hours left, hours done, days left. */
export function KpiRow({ dashboard, sprint, tasks }: KpiRowProps) {
  const done = tasks.filter((task) => task.status === 'Done').length
  const remaining = Math.max(0, dashboard.totalHours - dashboard.completedHours)
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <StatCard label="Tasks" value={String(tasks.length)} hint={`${done} done`} />
      <StatCard label="Remaining hours" value={String(Math.round(remaining * 10) / 10)} hint={`of ${formatHours(dashboard.totalHours)} planned`} tone={!dashboard.isOnTrack && remaining > 0 ? 'warn' : 'default'} />
      <StatCard label="Completed hours" value={String(Math.round(dashboard.completedHours * 10) / 10)} hint={`${Math.round(dashboard.progressPercent)}% of the sprint`} />
      <StatCard label="Days left" value={String(dashboard.daysLeft)} hint={`sprint ends ${formatDay(sprint.endDate)}`} />
    </Box>
  )
}
