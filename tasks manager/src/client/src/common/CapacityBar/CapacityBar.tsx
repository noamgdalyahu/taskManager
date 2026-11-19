import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

interface CapacityBarProps {
  /** Hours planned. */
  planned: number
  /** Hours the team can do. */
  capacity: number
  label: string
}

const round = (hours: number) => Math.round(hours * 10) / 10

/** Planned hours against capacity: indigo, amber over 90% and red over 100%. The text beside it says the same, so colour is never the only signal. */
export function CapacityBar({ planned, capacity, label }: CapacityBarProps) {
  const ratio = capacity > 0 ? planned / capacity : planned > 0 ? 2 : 0
  const state = ratio > 1 ? 'over capacity' : ratio > 0.9 ? 'almost full' : 'within capacity'
  const color = ratio > 1 ? tokens.color.danger : ratio > 0.9 ? tokens.color.stQa : tokens.color.stProgress
  return (
    <Box>
      <Box
        role="progressbar"
        aria-label={`${label}: ${round(planned)} of ${round(capacity)} hours, ${state}`}
        aria-valuemin={0}
        aria-valuemax={Math.max(capacity, planned)}
        aria-valuenow={planned}
        sx={{ height: 6, borderRadius: `${tokens.radius.key}px`, bgcolor: tokens.color.track, overflow: 'hidden' }}
      >
        <Box sx={{ width: `${Math.min(100, ratio * 100)}%`, height: '100%', bgcolor: color }} />
      </Box>
      <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: tokens.color.faint }}>
        <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
          {round(planned)} / {round(capacity)} h
        </Box>
        {ratio > 0.9 && (
          <Box component="span" sx={{ color: ratio > 1 ? tokens.color.danger : tokens.color.stQa, fontWeight: 500 }}>
            {ratio > 1 ? 'Over capacity' : 'Almost full'}
          </Box>
        )}
      </Box>
    </Box>
  )
}
