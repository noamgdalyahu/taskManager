import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Fragment } from 'react'
import type { SprintPlanDto, TaskDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

interface DependencyChainsProps {
  tasks: TaskDto[]
  plan: SprintPlanDto | null
}

/**
 * One chain of "must finish before" steps as a single pill. The arrows live inside the pill, so a step and its arrow can
 * never be separated by a line break: the text wraps within the pill, never between its parts.
 */
function ChainPill({ steps, critical }: { steps: string[]; critical?: boolean }) {
  return (
    <Box
      sx={{
        width: 'fit-content',
        maxWidth: '100%',
        px: 1.5,
        py: 1,
        borderRadius: `${tokens.radius.control}px`,
        fontSize: '0.8125rem',
        fontWeight: 500,
        lineHeight: 1.5,
        border: `1px solid ${critical ? tokens.color.ink : tokens.color.borderStrong}`,
        bgcolor: critical ? tokens.color.ink : 'background.paper',
        color: critical ? tokens.color.onInk : 'text.primary',
      }}
    >
      {steps.map((step, index) => (
        <Fragment key={index}>
          {index > 0 && <ArrowForwardRounded aria-label="then" sx={{ fontSize: 15, mx: 0.75, verticalAlign: 'text-bottom', opacity: 0.7 }} />}
          {step}
        </Fragment>
      ))}
    </Box>
  )
}

/** The dependency picture: the critical chain in a dark pill, then every other "must finish before" link. */
export function DependencyChains({ tasks, plan }: DependencyChainsProps) {
  const title = new Map(tasks.map((task) => [task.id, task.title]))
  const criticalIndex = new Map((plan?.criticalPath ?? []).map((id, index) => [id, index]))

  // Links between two sprint tasks that are not just the next step of the critical chain.
  const otherLinks: [string, string][] = []
  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!title.has(dependency)) continue
      const from = criticalIndex.get(dependency)
      const isCriticalStep = from !== undefined && criticalIndex.get(task.id) === from + 1
      if (!isCriticalStep) otherLinks.push([dependency, task.id])
    }
  }
  const shown = otherLinks.slice(0, 6)
  const blocking = plan?.warnings.some((warning) => warning.isBlocking)

  return (
    <Surface sx={{ flex: '1 1 280px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 1.75 }}>
        Dependencies
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {plan && plan.criticalPath.length > 0 && <ChainPill critical steps={plan.criticalPath.map((id) => title.get(id) ?? 'Task')} />}
        {shown.map(([from, to]) => (
          <ChainPill key={`${from}-${to}`} steps={[title.get(from) ?? 'Task', title.get(to) ?? 'Task']} />
        ))}
        {otherLinks.length > shown.length && (
          <Typography variant="body2" color="text.secondary">
            and {otherLinks.length - shown.length} more links
          </Typography>
        )}
        {!plan && otherLinks.length === 0 && <Typography color="text.secondary">No dependencies between the selected tasks</Typography>}
        {plan && (
          <Typography variant="body2" color="text.secondary">
            The dark pill is the critical path: {formatHours(plan.criticalPathHours)}. {blocking ? 'A dependency cycle was found. Break it before planning.' : 'No dependency cycles found'}
          </Typography>
        )}
      </Box>
    </Surface>
  )
}
