import Box from '@mui/material/Box'
import { tokens } from '@/theme/tokens'

interface StatStripProps {
  workItems: number
  remainingHours: number
  completedHours: number
  /** Which day of the sprint it is, and how many days the sprint has. */
  day: number
  days: number
}

const round = (hours: number) => Math.round(hours * 10) / 10

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ bgcolor: tokens.color.cell, borderRadius: `${tokens.radius.control}px`, p: 2, minWidth: 0 }}>
      <Box sx={{ fontSize: '0.8125rem', fontWeight: 500, color: tokens.color.muted }}>{label}</Box>
      <Box sx={{ mt: 0.5, fontFamily: tokens.font.mono, fontSize: '1.875rem', lineHeight: 1.2, fontWeight: 400 }}>{value}</Box>
    </Box>
  )
}

/** One bordered panel with four cells. Work items, Remaining and Completed follow the board's filters; the sprint day does not. */
export function StatStrip({ workItems, remainingHours, completedHours, day, days }: StatStripProps) {
  return (
    <Box
      component="section"
      aria-label="Sprint totals"
      sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface, p: 1.5, display: 'grid', gap: 1, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' } }}
    >
      <Stat label="Work items" value={String(workItems)} />
      <Stat label="Remaining (h)" value={String(round(remainingHours))} />
      <Stat label="Completed (h)" value={String(round(completedHours))} />
      <Stat label="Sprint day" value={`${day}/${days}`} />
    </Box>
  )
}
