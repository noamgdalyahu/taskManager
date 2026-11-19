import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { TaskDto, TeamMemberDto } from '@/api/types'
import { AssigneePicker } from '@/Board/BoardColumn/TaskCard/TaskCardView/AssigneePicker/AssigneePicker'
import { CriticalPathChip } from '@/common/CriticalPathChip/CriticalPathChip'
import { TagChip } from '@/common/TagChip/TagChip'
import { formatDay, formatHours } from '@/lib/format'
import { todayIso } from '@/lib/sprintDays'
import { tokens } from '@/theme/tokens'

interface TaskCardViewProps {
  task: TaskDto
  assignee?: TeamMemberDto
  critical?: boolean
  /** Titles of the unfinished tasks this one is waiting for. */
  to?: string
  actions?: ReactNode
  /** The floating copy that follows the pointer while dragging: lifted off the board with a deeper shadow. */
  lifted?: boolean
  members?: TeamMemberDto[]
  canEditAssignee?: boolean
  onAssign?: (memberId: string | null) => void
}

const OVERDUE_TAG = { bg: tokens.color.dangerSoft, fg: tokens.color.danger }

/**
 * What a card looks like, in the manner of an Azure Boards card: a coloured edge, the title, who owns it, tags,
 * and the estimate in the lower-right corner. Style rule: a critical-path card has a dark edge.
 * The draggable wrapper and the drag overlay both render this, so the two can never drift apart.
 */
export function TaskCardView({ task, assignee, critical, to, actions, lifted, members = [], canEditAssignee = false, onAssign }: TaskCardViewProps) {
  const overdue = !!task.deadline && task.status !== 'Done' && task.deadline < todayIso()
  const accent = critical ? tokens.color.ink : tokens.color.primary

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${tokens.color.border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: `${tokens.radius.task}px`,
        p: 1.5,
        pl: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        boxSizing: 'border-box',
        // A lifted card is deeper and slightly larger: size and shadow encode that it now floats above the board.
        ...(lifted && { transform: 'scale(1.03)', boxShadow: '0 16px 36px rgba(16, 24, 40, 0.2), 0 2px 8px rgba(16, 24, 40, 0.1)', cursor: 'grabbing' }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <AutoStoriesOutlined aria-hidden sx={{ fontSize: 16, mt: '2px', color: accent, flex: '0 0 auto' }} />
        <Typography
          component={to ? Link : 'div'}
          {...(to ? { to } : {})}
          // Dragging starts from anywhere on the card, so the title link must not steal the press.
          draggable={false}
          sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.primary', textDecoration: 'none', lineHeight: 1.35, '&:hover': to ? { color: 'primary.main', textDecoration: 'underline' } : undefined }}
        >
          {task.title}
        </Typography>
      </Box>

      <AssigneePicker assignee={assignee} members={members} editable={canEditAssignee} onChange={(id) => onAssign?.(id)} />

      {(critical || task.requiredSkills.length > 0 || task.deadline) && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {critical && <CriticalPathChip />}
          {task.requiredSkills.map((skill) => (
            <TagChip key={skill} label={skill} />
          ))}
          {task.deadline && <TagChip label={`${overdue ? 'Overdue' : 'Due'} ${formatDay(task.deadline)}`} tone={overdue ? OVERDUE_TAG : { bg: tokens.color.neutralBg, fg: tokens.color.neutralText }} />}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, color: 'text.secondary', fontSize: '0.75rem', minHeight: 24 }}>
        {formatHours(task.estimateHours)}
        {actions}
      </Box>
    </Box>
  )
}
