import Box from '@mui/material/Box'
import type { SprintDto, SprintPlanDto } from '@/api/types'
import { StatCard } from '@/common/StatCard/StatCard'
import { formatHours } from '@/lib/format'

interface PlanSummaryProps {
  sprint: SprintDto
  memberCount: number
  backlogCount: number
  plan: SprintPlanDto | null
}

/** The four numbers a manager checks first: can the team carry this, and how long is the unavoidable chain? */
export function PlanSummary({ sprint, memberCount, backlogCount, plan }: PlanSummaryProps) {
  const usedPercent = sprint.teamCapacityHours > 0 ? Math.round((sprint.totalEstimateHours / sprint.teamCapacityHours) * 100) : 0
  const overloaded = sprint.totalEstimateHours > sprint.teamCapacityHours

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <StatCard label="Team capacity" value={formatHours(sprint.teamCapacityHours)} hint={`${memberCount} members, ${sprint.workingDays} working days`} />
      <StatCard label="Planned" value={formatHours(sprint.totalEstimateHours)} hint={`${usedPercent}% of capacity`} tone={overloaded ? 'warn' : 'default'} />
      <StatCard label="Tasks selected" value={`${sprint.taskCount} of ${backlogCount}`} hint="from the backlog" />
      <StatCard
        label="Critical path"
        value={plan ? formatHours(plan.criticalPathHours) : '—'}
        hint={plan ? `${plan.criticalPath.length} tasks in sequence` : 'Press Suggest plan to calculate it'}
      />
    </Box>
  )
}
