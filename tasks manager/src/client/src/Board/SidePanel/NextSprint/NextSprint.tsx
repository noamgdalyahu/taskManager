import Box from '@mui/material/Box'
import { Link } from 'react-router-dom'
import type { SprintDto } from '@/api/types'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { tokens } from '@/theme/tokens'

interface NextSprintProps {
  projectId: string
  /** The sprint on screen; the next one is the earliest planned sprint that is not it. */
  current: SprintDto
  sprints: SprintDto[]
}

/** The sprint after this one, with a link into planning. */
export function NextSprint({ projectId, current, sprints }: NextSprintProps) {
  const next = sprints
    .filter((sprint) => sprint.id !== current.id && sprint.status === 'Planned')
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

  return (
    <Box component="section" aria-labelledby="next-sprint-heading">
      <Box component="h2" id="next-sprint-heading" sx={{ m: 0, mb: 1, fontSize: '0.8125rem', fontWeight: 500 }}>
        Next sprint
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.control}px`, bgcolor: tokens.color.cell }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {next ? (
            <>
              <Box dir="auto" sx={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {next.name}
              </Box>
              <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>
                {next.status.toLowerCase()} ·{' '}
                <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                  {next.taskCount}
                </Box>{' '}
                {next.taskCount === 1 ? 'task' : 'tasks'}
              </Box>
            </>
          ) : (
            <Box sx={{ fontSize: '0.8125rem', color: tokens.color.faint }}>No sprint planned yet</Box>
          )}
        </Box>
        <HairlineButton component={Link} to={next ? `/p/${projectId}/planning/${next.id}` : `/p/${projectId}/planning`} aria-label={next ? `Plan ${next.name}` : 'Plan a sprint'} sx={{ height: 28 }}>
          Plan
        </HairlineButton>
      </Box>
    </Box>
  )
}
