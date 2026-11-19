import Box from '@mui/material/Box'
import { Link } from 'react-router-dom'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { formatDay } from '@/lib/format'
import { daysBetween, todayIso } from '@/lib/sprintDays'
import { tokens } from '@/theme/tokens'

/** The sprint you are most likely working in: its name, how many days are left, and a thin bar of how far through it is. */
export function SprintCard({ projectId, onNavigate }: { projectId: string; onNavigate?: () => void }) {
  const { sprint } = useSprintSelection(projectId, undefined)
  if (!sprint) return null

  const today = todayIso()
  const total = daysBetween(sprint.startDate, sprint.endDate) + 1
  const elapsed = Math.min(total, Math.max(0, daysBetween(sprint.startDate, today) + 1))
  const left = Math.max(0, daysBetween(today, sprint.endDate))
  const caption =
    sprint.status === 'Closed' ? `Closed · ended ${formatDay(sprint.endDate)}` : daysBetween(today, sprint.startDate) > 0 ? `Starts ${formatDay(sprint.startDate)}` : null

  return (
    <Box
      component={Link}
      to={`/p/${projectId}/board/${sprint.id}`}
      onClick={onNavigate}
      aria-label={`${sprint.name}, ${left} days left. Open the sprint board`}
      sx={{
        display: 'block',
        p: 1.25,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.control}px`,
        color: 'inherit',
        textDecoration: 'none',
        '&:hover': { borderColor: tokens.color.borderHover },
      }}
    >
      <Box dir="auto" sx={{ fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sprint.name}
      </Box>
      <Box sx={{ mt: 0.25, fontSize: '0.75rem', color: tokens.color.faint }}>
        {caption ?? (
          <>
            <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
              {left}
            </Box>{' '}
            {left === 1 ? 'day' : 'days'} left · ends {formatDay(sprint.endDate)}
          </>
        )}
      </Box>
      <Box
        role="progressbar"
        aria-label={`Sprint day ${elapsed} of ${total}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={elapsed}
        sx={{ mt: 1, height: 3, borderRadius: `${tokens.radius.key}px`, bgcolor: tokens.color.track, overflow: 'hidden' }}
      >
        <Box sx={{ width: `${(elapsed / total) * 100}%`, height: '100%', bgcolor: tokens.color.stProgress }} />
      </Box>
    </Box>
  )
}
