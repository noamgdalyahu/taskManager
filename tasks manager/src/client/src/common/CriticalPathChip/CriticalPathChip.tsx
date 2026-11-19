import Chip from '@mui/material/Chip'
import { tokens } from '@/theme/tokens'

/** Dark chip marking a task whose delay delays the whole sprint (zero slack). */
export function CriticalPathChip() {
  return (
    <Chip
      size="small"
      label="Critical path"
      sx={{ bgcolor: tokens.color.ink, color: tokens.color.onInk, height: 22, fontSize: '0.6875rem' }}
    />
  )
}
