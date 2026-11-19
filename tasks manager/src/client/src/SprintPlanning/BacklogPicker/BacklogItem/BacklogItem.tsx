import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import type { TaskDto } from '@/api/types'
import { formatHours } from '@/lib/format'

interface BacklogItemProps {
  task: TaskDto
  selected: boolean
  busy: boolean
  onToggle: (selected: boolean) => void
}

export function BacklogItem({ task, selected, busy, onToggle }: BacklogItemProps) {
  return (
    <FormControlLabel
      disabled={busy}
      sx={{ m: 0, minHeight: 44, borderBottom: 1, borderColor: 'divider', width: '100%', '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 } }}
      control={<Checkbox checked={selected} onChange={(event) => onToggle(event.target.checked)} />}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography noWrap sx={{ flex: 1, color: selected ? 'text.primary' : 'text.secondary' }}>
            {task.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatHours(task.estimateHours)}
          </Typography>
        </Box>
      }
    />
  )
}
