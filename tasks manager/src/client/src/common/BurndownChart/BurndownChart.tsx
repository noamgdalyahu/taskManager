import Box from '@mui/material/Box'
import type { BurndownPointDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDay } from '@/lib/format'
import { tokens } from '@/theme/tokens'

interface BurndownChartProps {
  ideal: BurndownPointDto[]
  actual: BurndownPointDto[]
  forecast: BurndownPointDto[]
  title?: string
}

const W = 640
const H = 240
const PAD = { left: 44, right: 16, top: 12, bottom: 28 }

const round = (hours: number) => Math.round(hours * 10) / 10

/**
 * Remaining hours per day against the ideal line, with the forecast continuing past today. The data table under the
 * chart carries every value as text, so nothing is readable from colour or position alone.
 */
export function BurndownChart({ ideal, actual, forecast, title = 'Burndown' }: BurndownChartProps) {
  const dates = [...new Set([...ideal, ...actual, ...forecast].map((point) => point.date))].sort()
  const max = Math.max(1, ...[...ideal, ...actual, ...forecast].map((point) => point.remainingHours))
  const x = (date: string) => PAD.left + (dates.length < 2 ? 0 : (dates.indexOf(date) / (dates.length - 1)) * (W - PAD.left - PAD.right))
  const y = (hours: number) => PAD.top + (1 - hours / max) * (H - PAD.top - PAD.bottom)
  const path = (points: BurndownPointDto[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.date).toFixed(1)} ${y(point.remainingHours).toFixed(1)}`).join(' ')

  const lookup = (points: BurndownPointDto[], date: string) => points.find((point) => point.date === date)?.remainingHours
  const last = actual[actual.length - 1]
  const summary = last ? `${title}: ${round(last.remainingHours)} hours remaining on ${formatDay(last.date)}, ideal ${round(lookup(ideal, last.date) ?? 0)}.` : `${title}: no progress recorded yet.`

  return (
    <Surface component="section" aria-label={title}>
      <Box component="h2" sx={{ m: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
        {title}
      </Box>
      <Box sx={{ mt: 0.5, display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.75rem', color: tokens.color.muted }}>
        <Legend color={tokens.color.stProgress} label="Actual" />
        <Legend color={tokens.color.faint} label="Ideal" dashed />
        <Legend color={tokens.color.stQa} label="Forecast" dotted />
      </Box>
      {dates.length === 0 ? (
        <Box sx={{ mt: 2, color: tokens.color.faint, fontSize: '0.8125rem' }}>No burndown data yet</Box>
      ) : (
        <Box component="svg" role="img" aria-label={summary} viewBox={`0 0 ${W} ${H}`} sx={{ mt: 1, width: '100%', height: 'auto', display: 'block' }}>
          {[0, 0.5, 1].map((fraction) => (
            <g key={fraction}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(max * fraction)} y2={y(max * fraction)} stroke={tokens.color.border} />
              <text x={PAD.left - 8} y={y(max * fraction) + 4} textAnchor="end" fontSize="11" fill={tokens.color.faint} fontFamily={tokens.font.mono}>
                {round(max * fraction)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 8} fontSize="11" fill={tokens.color.faint}>
            {formatDay(dates[0])}
          </text>
          <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="11" fill={tokens.color.faint}>
            {formatDay(dates[dates.length - 1])}
          </text>
          <path d={path(ideal)} fill="none" stroke={tokens.color.faint} strokeWidth="1.5" strokeDasharray="5 4" />
          <path d={path(forecast)} fill="none" stroke={tokens.color.stQa} strokeWidth="1.5" strokeDasharray="1 4" strokeLinecap="round" />
          <path d={path(actual)} fill="none" stroke={tokens.color.stProgress} strokeWidth="2" />
        </Box>
      )}
      <Box component="details" sx={{ mt: 1.5, fontSize: '0.8125rem' }}>
        <Box component="summary" sx={{ cursor: 'pointer', color: tokens.color.muted }}>
          Show the data as a table
        </Box>
        <Box sx={{ mt: 1, maxHeight: 220, overflow: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { py: 0.5, px: 1, textAlign: 'right', borderBottom: `1px solid ${tokens.color.border}`, fontFamily: tokens.font.mono, fontSize: '0.75rem' }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left', fontFamily: 'inherit' } }}>
            <caption style={{ position: 'absolute', left: -9999 }}>{title} data, remaining hours per day</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Ideal</th>
                <th scope="col">Actual</th>
                <th scope="col">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr key={date}>
                  <td>{formatDay(date)}</td>
                  {[ideal, actual, forecast].map((series, index) => {
                    const value = lookup(series, date)
                    return <td key={index}>{value === undefined ? '' : round(value)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Box>
    </Surface>
  )
}

function Legend({ color, label, dashed, dotted }: { color: string; label: string; dashed?: boolean; dotted?: boolean }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box aria-hidden sx={{ width: 20, borderTop: `2px ${dotted ? 'dotted' : dashed ? 'dashed' : 'solid'} ${color}` }} />
      {label}
    </Box>
  )
}
