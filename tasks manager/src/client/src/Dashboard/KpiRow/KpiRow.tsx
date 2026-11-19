import Box from '@mui/material/Box'
import type { DashboardDto, SprintDto, TaskDto } from '@/api/types'
import { StatCard } from '@/common/StatCard/StatCard'
import { formatDay, formatHours } from '@/lib/format'
import { daysBetween } from '@/lib/sprintDays'

interface KpiRowProps {
  dashboard: DashboardDto
  sprint: SprintDto
  /** Tasks waiting in the QA column. */
  inQa: TaskDto[]
}

/** The four numbers a manager reads first. The forecast turns orange when it lands after the sprint ends. */
export function KpiRow({ dashboard, sprint, inQa }: KpiRowProps) {
  const forecast = dashboard.forecastFinishDate
  const lateBy = forecast ? daysBetween(sprint.endDate, forecast) : 0

  let forecastHint = 'Not enough data to forecast yet'
  if (forecast) forecastHint = lateBy > 0 ? `${lateBy} ${lateBy === 1 ? 'day' : 'days'} after sprint end` : 'on or before sprint end'

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <StatCard label="Progress" value={`${Math.round(dashboard.progressPercent)}%`} hint={`${formatHours(dashboard.completedHours)} of ${formatHours(dashboard.totalHours)} done`} />
      <StatCard label="Days left" value={String(dashboard.daysLeft)} hint={`sprint ends ${formatDay(sprint.endDate)}`} />
      <StatCard label="Forecast finish" value={forecast ? formatDay(forecast) : '—'} hint={forecastHint} tone={forecast && !dashboard.isOnTrack ? 'warn' : 'default'} />
      <StatCard label="In QA" value={String(inQa.length)} hint={inQa[0]?.title ?? 'Nothing is waiting for QA'} />
    </Box>
  )
}
