import Typography from '@mui/material/Typography'
import type { SprintReportDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { tokens } from '@/theme/tokens'

const W = 560
const H = 220
const LEFT = 40
const BOTTOM = 36
const TOP = 16

interface VelocityBarsProps {
  sprints: SprintReportDto[]
  average: number | null
}

/** Hours completed per working day, one bar per sprint. The dashed line is the average of the closed sprints. */
export function VelocityBars({ sprints, average }: VelocityBarsProps) {
  const max = Math.max(1, ...sprints.map((s) => s.velocityHoursPerDay), average ?? 0) * 1.15
  const slot = (W - LEFT - 8) / Math.max(sprints.length, 1)
  const barWidth = Math.min(56, slot * 0.6)
  const y = (value: number) => TOP + (1 - value / max) * (H - TOP - BOTTOM)
  const summary = `Velocity per sprint: ${sprints.map((s) => `${s.name} ${s.velocityHoursPerDay.toFixed(1)} hours per day`).join(', ')}.`

  return (
    <Surface sx={{ flex: '1 1 420px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 0.25 }}>
        Velocity trend
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Hours of estimated work finished per working day
      </Typography>
      {sprints.length === 0 ? (
        <Typography color="text.secondary">Velocity appears after the first sprint has run.</Typography>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary} style={{ display: 'block' }}>
          <line x1={LEFT} x2={W - 8} y1={y(0)} y2={y(0)} stroke={tokens.color.border} />
          {sprints.map((sprint, index) => {
            const x = LEFT + slot * index + (slot - barWidth) / 2
            const top = y(sprint.velocityHoursPerDay)
            return (
              <g key={sprint.sprintId}>
                <rect x={x} y={top} width={barWidth} height={y(0) - top} rx="6" fill={sprint.status === 'Closed' ? tokens.color.primary : tokens.color.borderStrong} />
                <text x={x + barWidth / 2} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={tokens.color.text}>
                  {sprint.velocityHoursPerDay.toFixed(1)}
                </text>
                <text x={x + barWidth / 2} y={H - 14} textAnchor="middle" fontSize="11" fill={tokens.color.muted}>
                  {sprint.name}
                </text>
              </g>
            )
          })}
          {average !== null && (
            <g>
              <line x1={LEFT} x2={W - 8} y1={y(average)} y2={y(average)} stroke={tokens.color.forecast} strokeDasharray="5 4" strokeWidth="2" />
              <text x={W - 8} y={y(average) - 6} textAnchor="end" fontSize="11" fill={tokens.color.forecast}>
                average {average.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      )}
    </Surface>
  )
}
