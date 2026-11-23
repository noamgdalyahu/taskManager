import FlagRounded from '@mui/icons-material/FlagRounded'
import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

/** Amber pill marking a task whose delay delays the whole sprint (zero slack). */
export function CriticalPathChip() {
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.125, borderRadius: '3px', bgcolor: tokens.color.warnBg, color: tokens.color.warnText, fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1.6, whiteSpace: 'nowrap' }}
    >
      <FlagRounded aria-hidden sx={{ fontSize: 12 }} />
      Critical path
    </Box>
  )
}
