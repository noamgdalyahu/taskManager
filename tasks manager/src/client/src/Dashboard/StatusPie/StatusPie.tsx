import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { STATUS_LABEL, TASK_STATUSES, type TaskStatus } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { tokens } from '@/theme/tokens'

/** One colour per status, the same everywhere it appears. "To do" is the neutral gray: not started has no hue. */
const STATUS_COLOR: Record<TaskStatus, string> = {
  ToDo: tokens.color.stTodo,
  InProgress: tokens.color.stProgress,
  InQA: tokens.color.stQa,
  Done: tokens.color.stDone,
}

const SIZE = 168
const CENTER = SIZE / 2
const OUTER = 76
const INNER = 48

/** A point on the circle, with 0 degrees at twelve o'clock and angles growing clockwise. */
function point(radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)]
}

/** The ring segment between two angles: outer arc forward, inner arc back. */
function segment(from: number, to: number): string {
  const [x1, y1] = point(OUTER, from)
  const [x2, y2] = point(OUTER, to)
  const [x3, y3] = point(INNER, to)
  const [x4, y4] = point(INNER, from)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${OUTER} ${OUTER} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER} ${INNER} 0 ${large} 0 ${x4} ${y4} Z`
}

interface StatusPieProps {
  /** Number of tasks in each status. */
  counts: Record<TaskStatus, number>
}

/** The sprint's tasks split by status: a ring with the total in its middle, and a legend that carries every number. */
export function StatusPie({ counts }: StatusPieProps) {
  const [active, setActive] = useState<TaskStatus | null>(null)
  const total = TASK_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  const present = TASK_STATUSES.filter((status) => counts[status] > 0)

  let start = 0
  const slices = present.map((status) => {
    const sweep = (counts[status] / total) * 360
    const slice = { status, from: start, to: start + sweep }
    start += sweep
    return slice
  })

  const summary = `Tasks by status: ${TASK_STATUSES.map((status) => `${counts[status]} ${STATUS_LABEL[status]}`).join(', ')}.`
  const shown = active ?? null

  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 1.75 }}>
        Tasks by status
      </Typography>
      {total === 0 ? (
        <Typography color="text.secondary">There are no tasks in this sprint yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={summary} style={{ flex: '0 0 auto' }}>
            {slices.length === 1 ? (
              // A single status fills the whole ring; an arc from a point to itself would draw nothing.
              <path
                d={`${segment(0, 179.999)} ${segment(180, 359.999)}`}
                fill={STATUS_COLOR[slices[0].status]}
                fillRule="evenodd"
                onMouseEnter={() => setActive(slices[0].status)}
                onMouseLeave={() => setActive(null)}
              />
            ) : (
              slices.map(({ status, from, to }) => (
                <path
                  key={status}
                  d={segment(from, to)}
                  fill={STATUS_COLOR[status]}
                  // A 2px surface-coloured edge is the gap between neighbouring slices.
                  stroke={tokens.color.surface}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  opacity={shown && shown !== status ? 0.35 : 1}
                  style={{ transition: 'opacity 120ms ease-out' }}
                  onMouseEnter={() => setActive(status)}
                  onMouseLeave={() => setActive(null)}
                >
                  <title>{`${STATUS_LABEL[status]}: ${counts[status]} of ${total}`}</title>
                </path>
              ))
            )}
            <text x={CENTER} y={CENTER - 2} textAnchor="middle" fontSize="26" fontWeight="700" fill={tokens.color.text}>
              {shown ? counts[shown] : total}
            </text>
            <text x={CENTER} y={CENTER + 16} textAnchor="middle" fontSize="11" fill={tokens.color.muted}>
              {shown ? STATUS_LABEL[shown] : total === 1 ? 'task' : 'tasks'}
            </text>
          </svg>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {TASK_STATUSES.map((status) => (
              <Box
                component="li"
                key={status}
                onMouseEnter={() => setActive(status)}
                onMouseLeave={() => setActive(null)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8125rem', color: 'text.secondary', opacity: shown && shown !== status ? 0.5 : 1 }}
              >
                <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: STATUS_COLOR[status], flex: '0 0 auto' }} />
                <Box component="span" sx={{ flex: 1 }}>
                  {STATUS_LABEL[status]}
                </Box>
                <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {counts[status]}
                </Box>
                <Box component="span" sx={{ width: 40, textAlign: 'right' }}>
                  {Math.round((counts[status] / total) * 100)}%
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Surface>
  )
}
