import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ProgressBar } from '@/common/ProgressBar/ProgressBar'
import { Surface } from '@/common/Surface/Surface'
import { formatHours, percent } from '@/lib/format'

interface MySprintPanelProps {
  completedHours: number
  assignedHours: number
  capacityHours: number
}

function Line({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <Typography component="span" color="text.secondary">
          {formatHours(value)} of {formatHours(total)}
        </Typography>
      </Box>
      <ProgressBar value={percent(value, total)} label={`${label}: ${formatHours(value)} of ${formatHours(total)}`} />
    </Box>
  )
}

export function MySprintPanel({ completedHours, assignedHours, capacityHours }: MySprintPanelProps) {
  return (
    <Surface sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Typography variant="h2" component="h2">
        My sprint
      </Typography>
      <Line label="Completed" value={completedHours} total={assignedHours} />
      <Line label="Capacity used" value={assignedHours} total={capacityHours} />
    </Surface>
  )
}
