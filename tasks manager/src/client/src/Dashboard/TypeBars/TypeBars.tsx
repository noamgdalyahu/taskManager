import Box from '@mui/material/Box'
import { TASK_TYPES, TASK_TYPE_LABEL, type TaskDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatHours } from '@/lib/format'
import { tokens } from '@/theme/tokens'

/** The sprint's tasks by type: a bar per type, with the count and the hours written beside it, so the list is its own text version. */
export function TypeBars({ tasks }: { tasks: TaskDto[] }) {
  const rows = TASK_TYPES.map((type) => {
    const mine = tasks.filter((task) => task.type === type)
    return { label: TASK_TYPE_LABEL[type], count: mine.length, hours: mine.reduce((sum, task) => sum + task.estimateHours, 0) }
  })
  const untyped = tasks.filter((task) => !task.type)
  if (untyped.length > 0) rows.push({ label: 'No type', count: untyped.length, hours: untyped.reduce((sum, task) => sum + task.estimateHours, 0) })
  const shown = rows.filter((row) => row.count > 0)
  const max = Math.max(1, ...shown.map((row) => row.count))

  return (
    <Surface component="section" aria-label="Tasks by type">
      <Box component="h2" sx={{ m: 0, mb: 1.5, fontSize: '0.9375rem', fontWeight: 600 }}>
        Tasks by type
      </Box>
      {shown.length === 0 ? (
        <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>No tasks in this sprint yet.</Box>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {shown.map((row) => (
            <li key={row.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', mb: 0.5 }}>
                <span>{row.label}</span>
                <Box component="span" sx={{ fontFamily: tokens.font.mono, color: tokens.color.muted }}>
                  {row.count} · {formatHours(row.hours)}
                </Box>
              </Box>
              <Box aria-hidden sx={{ height: 6, borderRadius: `${tokens.radius.key}px`, bgcolor: tokens.color.track, overflow: 'hidden' }}>
                <Box sx={{ width: `${(row.count / max) * 100}%`, height: '100%', bgcolor: tokens.color.stProgress }} />
              </Box>
            </li>
          ))}
        </Box>
      )}
    </Surface>
  )
}
