import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { SprintDto, SprintStatus } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDay, formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

const c = tokens.color
const tone: Record<SprintStatus, { bg: string; fg: string }> = {
  Planned: { bg: c.neutralBg, fg: c.neutralText },
  Active: { bg: c.primarySoft, fg: c.primaryHover },
  Closed: { bg: c.tealBg, fg: c.tealText },
}

export function SprintCard({ sprint, projectId }: { sprint: SprintDto; projectId: string }) {
  const base = `/p/${projectId}`
  return (
    <Surface sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box>
          <Typography variant="h2" component="h3">
            {sprint.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDay(sprint.startDate)} to {formatDay(sprint.endDate)}
          </Typography>
        </Box>
        <Chip size="small" label={sprint.status === 'Closed' ? 'Completed' : sprint.status} sx={{ bgcolor: tone[sprint.status].bg, color: tone[sprint.status].fg }} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {sprint.taskCount} {sprint.taskCount === 1 ? 'task' : 'tasks'}, {formatHours(sprint.totalEstimateHours)} planned of {formatHours(sprint.teamCapacityHours)} capacity
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" component={Link} to={`${base}/planning/${sprint.id}`}>
          Plan
        </Button>
        <Button size="small" variant="outlined" component={Link} to={`${base}/board/${sprint.id}`}>
          Board
        </Button>
        <Button size="small" variant="outlined" component={Link} to={`${base}/dashboard/${sprint.id}`}>
          Dashboard
        </Button>
      </Box>
    </Surface>
  )
}
