import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

interface TagChipProps {
  label: string
  /** Tinted colours; neutral when omitted. */
  tone?: { bg: string; fg: string }
}

/** A small tinted pill. */
export function TagChip({ label, tone = { bg: tokens.color.neutralBg, fg: tokens.color.neutralText } }: TagChipProps) {
  return (
    <Box
      component="span"
      sx={{ display: 'inline-block', px: 1, py: 0.125, borderRadius: '3px', fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1.6, bgcolor: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}
    >
      {label}
    </Box>
  )
}
