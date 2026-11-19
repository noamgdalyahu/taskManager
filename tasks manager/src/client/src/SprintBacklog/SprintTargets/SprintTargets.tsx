import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useDroppable } from '@dnd-kit/core'
import type { SprintDto } from '@/api/types'
import { CapacityBar } from '@/common/CapacityBar/CapacityBar'
import { formatDay } from '@/lib/format'
import { tokens } from '@/theme/tokens'

/** The id used for the "no sprint" drop target. */
export const NO_SPRINT = 'no-sprint'

const STATUS_LABEL: Record<SprintDto['status'], string> = { Planned: 'Planned', Active: 'Active', Closed: 'Completed' }

function Target({ id, enabled, children }: { id: string; enabled: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !enabled })
  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 1.5,
        border: `1px ${isOver ? 'dashed' : 'solid'} ${isOver ? tokens.color.borderHover : tokens.color.border}`,
        borderRadius: `${tokens.radius.card}px`,
        bgcolor: isOver ? tokens.color.wash : tokens.color.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {children}
    </Box>
  )
}

interface SprintTargetsProps {
  sprints: SprintDto[]
  canDrop: boolean
}

/** The sprints on the right. Dropping a work item on one moves it there; each shows planned hours against capacity. */
export function SprintTargets({ sprints, canDrop }: SprintTargetsProps) {
  const open = sprints.filter((sprint) => sprint.status !== 'Closed')
  return (
    <Box component="aside" aria-label="Sprints" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
      <Typography component="h2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
        Sprints
      </Typography>
      {open.length === 0 && <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>No open sprints. Create one from the + menu.</Box>}
      {open.map((sprint) => (
        <Target key={sprint.id} id={sprint.id} enabled={canDrop}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
            <Box dir="auto" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              {sprint.name}
            </Box>
            <Box component="span" sx={{ fontSize: '0.6875rem', color: tokens.color.faint }}>
              {STATUS_LABEL[sprint.status]}
            </Box>
          </Box>
          <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>
            {formatDay(sprint.startDate)} to {formatDay(sprint.endDate)} ·{' '}
            <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
              {sprint.taskCount}
            </Box>{' '}
            {sprint.taskCount === 1 ? 'task' : 'tasks'}
          </Box>
          <CapacityBar planned={sprint.totalEstimateHours} capacity={sprint.teamCapacityHours} label={sprint.name} />
        </Target>
      ))}
      <Target id={NO_SPRINT} enabled={canDrop}>
        <Box sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>Backlog</Box>
        <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>Drop here to take a work item out of its sprint.</Box>
      </Target>
      {!canDrop && <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>Only managers can move work items between sprints.</Box>}
    </Box>
  )
}
