import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { STATUS_LABEL, type HistoryDto, type TaskStatus, type TeamMemberDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDateTime } from '@/lib/format'

function statusLabel(value: string | null): string {
  return value && value in STATUS_LABEL ? STATUS_LABEL[value as TaskStatus] : (value ?? 'none')
}

/** One plain sentence per change: the audit trail should read like something a person would say. */
function describe(entry: HistoryDto, nameOf: (id: string | null) => string): string {
  switch (entry.field) {
    case 'created':
      return 'created the task'
    case 'status':
      return `moved it from ${statusLabel(entry.oldValue)} to ${statusLabel(entry.newValue)}`
    case 'assignee':
      return entry.newValue ? `assigned it to ${nameOf(entry.newValue)}` : `unassigned it (was ${nameOf(entry.oldValue)})`
    case 'estimate':
      return `changed the estimate from ${entry.oldValue} to ${entry.newValue}`
    case 'deadline':
      return entry.newValue ? `set the deadline to ${entry.newValue}` : 'removed the deadline'
    case 'dependencies':
      return 'changed what it depends on'
    case 'sprint':
      return 'moved it to another sprint'
    default:
      return `changed the ${entry.field}`
  }
}

export function ActivityLog({ history, members }: { history: HistoryDto[]; members: Map<string, TeamMemberDto> }) {
  const nameOf = (id: string | null) => (id ? (members.get(id)?.name ?? 'someone') : 'nobody')
  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 1 }}>
        History
      </Typography>
      {history.length === 0 && <Typography color="text.secondary">No changes recorded</Typography>}
      {history.map((entry) => (
        <Box key={entry.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2">
            <strong>{nameOf(entry.changedBy)}</strong> {describe(entry, nameOf)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(entry.at)}
          </Typography>
        </Box>
      ))}
    </Surface>
  )
}
