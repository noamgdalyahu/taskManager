import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { TaskDto, TeamMemberDto } from '@/api/types'
import { AssigneePicker } from '@/Board/BoardGrid/StoryLane/LaneCell/TaskCard/TaskCardView/AssigneePicker/AssigneePicker'
import { CriticalPathChip } from '@/common/CriticalPathChip/CriticalPathChip'
import { TagChip } from '@/common/TagChip/TagChip'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { formatDay, formatHours, shortId } from '@/lib/format'
import { todayIso } from '@/lib/sprintDays'
import { tokens } from '@/theme/tokens'

interface TaskCardViewProps {
  task: TaskDto
  assignee?: TeamMemberDto
  critical?: boolean
  to?: string
  actions?: ReactNode
  /** The floating copy that follows the pointer while dragging: lifted off the board with a deeper shadow. */
  lifted?: boolean
  members?: TeamMemberDto[]
  canEditAssignee?: boolean
  onAssign?: (memberId: string | null) => void
}

const OVERDUE_TAG = { bg: tokens.color.dangerSoft, fg: tokens.color.danger }
const DUE_TAG = { bg: tokens.color.neutralBg, fg: tokens.color.neutralText }

/**
 * A task card: mono id and the critical-path tag on top, the title, tag pills, then the owner and the estimate.
 * The draggable wrapper and the drag overlay both render this, so the two never drift apart.
 */
export function TaskCardView({ task, assignee, critical, to, actions, lifted, members = [], canEditAssignee = false, onAssign }: TaskCardViewProps) {
  const overdue = !!task.deadline && task.status !== 'Done' && task.deadline < todayIso()

  return (
    <Box
      sx={{
        bgcolor: tokens.color.card,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.task}px`,
        boxShadow: tokens.color.shadow,
        p: 1.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        boxSizing: 'border-box',
        '&:hover': { bgcolor: tokens.color.cardHover, borderColor: tokens.color.borderHover },
        ...(lifted && { transform: 'scale(1.02)', boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)', cursor: 'grabbing', borderColor: tokens.color.borderHover }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 20 }}>
        <Box component="span" sx={{ color: tokens.color.faint, fontFamily: tokens.font.mono, fontSize: '0.6875rem' }}>
          #{shortId(task.id)}
        </Box>
        {critical && <CriticalPathChip />}
      </Box>

      <Typography
        component={to ? Link : 'div'}
        {...(to ? { to } : {})}
        dir="ltr"
        // Dragging starts from anywhere on the card, so the title link must not steal the press.
        draggable={false}
        sx={{ fontWeight: 500, fontSize: '0.84375rem', color: tokens.color.text, textDecoration: 'none', lineHeight: 1.4, overflowWrap: 'anywhere', '&:hover': to ? { textDecoration: 'underline' } : undefined }}
      >
        {task.title}
      </Typography>

      {(task.type || task.deadline) && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TypeChip type={task.type} />
          {task.deadline && <TagChip label={`${overdue ? 'Overdue' : 'Due'} ${formatDay(task.deadline)}`} tone={overdue ? OVERDUE_TAG : DUE_TAG} />}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 24 }}>
        <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
          <AssigneePicker assignee={assignee} members={members} editable={canEditAssignee} onChange={(id) => onAssign?.(id)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flex: '0 0 auto', color: tokens.color.muted, fontFamily: tokens.font.mono, fontSize: '0.75rem' }}>
          <span>{formatHours(task.estimateHours)}</span>
          {actions}
        </Box>
      </Box>
    </Box>
  )
}
