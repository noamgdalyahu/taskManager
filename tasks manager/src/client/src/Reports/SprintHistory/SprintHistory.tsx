import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SprintReportDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDay, formatHours } from '@/lib/format'

const COLUMNS = 'minmax(120px, 1.4fr) 1.3fr repeat(4, minmax(64px, 0.8fr))'
const head = { color: 'text.secondary', fontWeight: 600, fontSize: '0.8125rem', py: 0.75, borderBottom: 1, borderColor: 'divider' }
const cell = { py: 1.25, borderBottom: 1, borderColor: 'divider' }

export function SprintHistory({ sprints }: { sprints: SprintReportDto[] }) {
  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 0.25 }}>
        Sprint history
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Accuracy is estimated hours divided by logged hours: 100% is a perfect estimate, below 100% means the work took longer than planned.
      </Typography>
      {sprints.length === 0 ? (
        <Typography color="text.secondary">No sprint has started yet.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: COLUMNS, columnGap: 1.5, minWidth: 640 }}>
            <Box sx={head}>Sprint</Box>
            <Box sx={head}>Dates</Box>
            <Box sx={head}>Planned</Box>
            <Box sx={head}>Completed</Box>
            <Box sx={head}>Logged</Box>
            <Box sx={head}>Accuracy</Box>
            {sprints.map((sprint) => (
              <Box key={sprint.sprintId} sx={{ display: 'contents' }}>
                <Box sx={{ ...cell, fontWeight: 600 }}>
                  {sprint.name}{' '}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {sprint.status}
                  </Typography>
                </Box>
                <Box sx={{ ...cell, color: 'text.secondary' }}>
                  {formatDay(sprint.startDate)} to {formatDay(sprint.endDate)}
                </Box>
                <Box sx={cell}>{formatHours(sprint.plannedHours)}</Box>
                <Box sx={cell}>{formatHours(sprint.completedHours)}</Box>
                <Box sx={cell}>{formatHours(sprint.loggedHours)}</Box>
                <Box sx={cell}>{sprint.loggedHours > 0 ? `${Math.round(sprint.estimateAccuracyPercent)}%` : '—'}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Surface>
  )
}
