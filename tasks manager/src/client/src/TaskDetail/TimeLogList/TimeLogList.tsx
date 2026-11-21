import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { TeamMemberDto, TimeLogDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDay, formatHours } from '@/lib/format'

interface TimeLogListProps {
  logs: TimeLogDto[]
  members: Map<string, TeamMemberDto>
  loggedHours: number
  estimateHours: number
}

export function TimeLogList({ logs, members, loggedHours, estimateHours }: TimeLogListProps) {
  return (
    <Surface>
      <Typography variant="h2" component="h2">
        Time logged
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatHours(loggedHours)} of {formatHours(estimateHours)} estimated
      </Typography>
      {logs.length === 0 && <Typography color="text.secondary">Nobody has logged time yet</Typography>}
      {logs.map((log) => (
        <Box key={log.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2">
            {members.get(log.memberId)?.name ?? 'Former member'}
            {log.note ? `: ${log.note}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {formatHours(log.hours)} · {formatDay(log.date)}
          </Typography>
        </Box>
      ))}
    </Surface>
  )
}
