import Box from '@mui/material/Box'
import type { Lane } from '@/Board/boardLanes'
import { formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

/** Segments in the order the work flows: done, QA, in progress, then what is left to start. */
const SEGMENTS = [
  { status: 'Done', color: tokens.color.stDone, label: 'done' },
  { status: 'InQA', color: tokens.color.stQa, label: 'in QA' },
  { status: 'InProgress', color: tokens.color.stProgress, label: 'in progress' },
  { status: 'ToDo', color: tokens.color.stTodo, label: 'to do' },
] as const

const round = (hours: number) => Math.round(hours * 10) / 10

/** A segmented bar of the lane's hours by state, and "done / total h". */
export function LaneRollup({ lane }: { lane: Lane }) {
  const summary = SEGMENTS.map((segment) => `${formatHours(lane.hoursByStatus[segment.status])} ${segment.label}`).join(', ')
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '0 0 auto', width: { xs: '100%', sm: 300 } }}>
      <Box
        role="img"
        aria-label={`${lane.title}: ${summary}`}
        sx={{ flex: 1, minWidth: 60, height: 4, borderRadius: `${tokens.radius.key}px`, overflow: 'hidden', display: 'flex', bgcolor: tokens.color.track }}
      >
        {lane.totalHours > 0 &&
          SEGMENTS.map((segment) => (
            <Box key={segment.status} sx={{ width: `${(lane.hoursByStatus[segment.status] / lane.totalHours) * 100}%`, bgcolor: segment.color }} />
          ))}
      </Box>
      <Box sx={{ flex: '0 0 auto', minWidth: 76, textAlign: 'right', fontSize: '0.75rem', color: tokens.color.muted, fontFamily: tokens.font.mono, whiteSpace: 'nowrap' }}>
        {round(lane.hoursByStatus.Done)} / {round(lane.totalHours)} h
      </Box>
    </Box>
  )
}
