import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TaskDto } from '@/api/types'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { formatHours } from '@/lib/format'

interface BacklogRowProps {
  task: TaskDto
  /** Where the task lives: a sprint name, or "Backlog". */
  place: string
  to: string
}

export function BacklogRow({ task, place, to }: BacklogRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography component={Link} to={to} sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
          {task.title}
        </Typography>
        {task.type && (
          <Box sx={{ mt: 0.5 }}>
            <TypeChip type={task.type} />
          </Box>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 120px' }}>
        {place}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 56px', textAlign: 'right' }}>
        {formatHours(task.estimateHours)}
      </Typography>
      <Box sx={{ flex: '0 0 104px', display: 'flex', justifyContent: 'flex-end' }}>
        <StatusChip status={task.status} />
      </Box>
    </Box>
  )
}
