import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import type { TaskDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { downloadCsv } from '@/lib/csv'
import { formatDay } from '@/lib/format'
import { addDays, daysBetween, todayIso } from '@/lib/sprintDays'
import { ReportToolbar } from '@/Reports/ReportToolbar/ReportToolbar'
import { tokens } from '@/theme/tokens'

const W = 640
const H = 240
const PAD = { left: 40, right: 16, top: 12, bottom: 28 }
const MAX_DAYS = 120

/**
 * Cumulative flow of the whole project: how many tasks exist, and how many of them are done, day by day. The server keeps
 * each task's creation and completion time but not its state on every past day, so the flow has two bands (done and open),
 * not one band per board column.
 */
export function FlowReport({ tasks }: { tasks: TaskDto[] }) {
  const earliest = tasks.map((task) => task.createdAt.slice(0, 10)).sort()[0] ?? todayIso()
  const [from, setFrom] = useState(() => (daysBetween(earliest, todayIso()) > 42 ? addDays(todayIso(), -42) : earliest))
  const [to, setTo] = useState(todayIso)

  const rows = useMemo(() => {
    const span = Math.min(MAX_DAYS, Math.max(0, daysBetween(from, to)))
    return Array.from({ length: span + 1 }, (_, index) => {
      const date = addDays(from, index)
      const created = tasks.filter((task) => task.createdAt.slice(0, 10) <= date).length
      const done = tasks.filter((task) => task.completedAt && task.completedAt.slice(0, 10) <= date).length
      return { date, done, open: created - done }
    })
  }, [tasks, from, to])

  const max = Math.max(1, ...rows.map((row) => row.done + row.open))
  const x = (index: number) => PAD.left + (rows.length < 2 ? 0 : (index / (rows.length - 1)) * (W - PAD.left - PAD.right))
  const y = (value: number) => PAD.top + (1 - value / max) * (H - PAD.top - PAD.bottom)
  const area = (top: (row: (typeof rows)[number]) => number, bottom: (row: (typeof rows)[number]) => number) =>
    `${rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(1)} ${y(top(row)).toFixed(1)}`).join(' ')} ${[...rows]
      .reverse()
      .map((row, index) => `L ${x(rows.length - 1 - index).toFixed(1)} ${y(bottom(row)).toFixed(1)}`)
      .join(' ')} Z`

  const last = rows[rows.length - 1]
  const exportCsv = () => downloadCsv('cumulative-flow.csv', ['Date', 'Done', 'Open', 'Total'], rows.map((row) => [row.date, row.done, row.open, row.done + row.open]))
  const field = { '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }

  return (
    <>
      <ReportToolbar title="Cumulative flow" description="Tasks created and tasks done, day by day, for the whole project. A widening open band means work arrives faster than it finishes." onExport={exportCsv} canExport={rows.length > 0}>
        <TextField size="small" type="date" label="From" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={field} />
        <TextField size="small" type="date" label="To" value={to} error={to < from} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={field} />
      </ReportToolbar>
      <Surface component="section" aria-label="Cumulative flow">
        {tasks.length === 0 ? (
          <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>The project has no tasks yet</Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: tokens.color.muted }}>
              <Swatch color={tokens.color.stDone} label="Done" />
              <Swatch color={tokens.color.stProgress} label="Open" />
            </Box>
            <Box component="svg" role="img" aria-label={`Cumulative flow from ${formatDay(from)} to ${formatDay(to)}: ${last?.done ?? 0} tasks done and ${last?.open ?? 0} open on the last day.`} viewBox={`0 0 ${W} ${H}`} sx={{ mt: 1, width: '100%', height: 'auto', display: 'block' }}>
              {[0, 0.5, 1].map((fraction) => (
                <g key={fraction}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(max * fraction)} y2={y(max * fraction)} stroke={tokens.color.border} />
                  <text x={PAD.left - 8} y={y(max * fraction) + 4} textAnchor="end" fontSize="11" fill={tokens.color.faint} fontFamily={tokens.font.mono}>
                    {Math.round(max * fraction)}
                  </text>
                </g>
              ))}
              <path d={area((row) => row.done + row.open, (row) => row.done)} fill={tokens.color.stProgress} fillOpacity="0.45" stroke={tokens.color.stProgress} />
              <path d={area((row) => row.done, () => 0)} fill={tokens.color.stDone} fillOpacity="0.55" stroke={tokens.color.stDone} />
              <text x={PAD.left} y={H - 8} fontSize="11" fill={tokens.color.faint}>
                {formatDay(rows[0].date)}
              </text>
              <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="11" fill={tokens.color.faint}>
                {formatDay(last.date)}
              </text>
            </Box>
            <Box component="details" sx={{ mt: 1.5, fontSize: '0.8125rem' }}>
              <Box component="summary" sx={{ cursor: 'pointer', color: tokens.color.muted }}>
                Show the data as a table
              </Box>
              <Box sx={{ mt: 1, maxHeight: 220, overflow: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { py: 0.5, px: 1, textAlign: 'right', borderBottom: `1px solid ${tokens.color.border}`, fontFamily: tokens.font.mono, fontSize: '0.75rem' }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left', fontFamily: 'inherit' } }}>
                  <caption style={{ position: 'absolute', left: -9999 }}>Cumulative flow data, tasks per day</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Done</th>
                      <th scope="col">Open</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDay(row.date)}</td>
                        <td>{row.done}</td>
                        <td>{row.open}</td>
                        <td>{row.done + row.open}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Surface>
    </>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
      {label}
    </Box>
  )
}
