import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { MyTaskDto } from '@/api/types'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { formatDay, formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

interface PriorityRowProps {
  item: MyTaskDto
}

/** One task in priority order, with the reason for its rank: the algorithm explains itself instead of being a black box. */
export function PriorityRow({ item }: PriorityRowProps) {
  const { task } = item
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box
        aria-label={`Priority ${item.rank}`}
        sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: tokens.color.primarySoft, color: tokens.color.primaryHover, fontWeight: 700, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}
      >
        {item.rank}
      </Box>
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography
          component={Link}
          to={`/p/${task.projectId}/tasks/${task.id}`}
          sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {item.reason}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 96px' }}>
        {task.deadline ? `Due ${formatDay(task.deadline)}` : 'No deadline'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flex: '0 0 64px' }}>
        {formatHours(task.estimateHours)}
      </Typography>
      {/* A fixed-width slot, so the columns line up row to row whatever the chip's own width. */}
      <Box sx={{ flex: '0 0 104px', display: 'flex', justifyContent: 'flex-end' }}>
        <StatusChip status={task.status} />
      </Box>
    </Box>
  )
}
