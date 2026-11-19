import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useDroppable } from '@dnd-kit/core'
import { STATUS_LABEL, type TaskDto, type TaskStatus, type TeamMemberDto } from '@/api/types'
import { NewItemInput } from '@/Board/BoardColumn/NewItemInput/NewItemInput'
import { TaskCard } from '@/Board/BoardColumn/TaskCard/TaskCard'
import { WipCount } from '@/Board/BoardColumn/WipCount/WipCount'
import { tokens } from '@/theme/tokens'

interface BoardColumnProps {
  status: TaskStatus
  /** The cards to show (after the filter). */
  tasks: TaskDto[]
  /** How many cards the column really holds, for the work in progress count (a filter must not hide an overload). */
  totalCount: number
  limit?: number
  members: Map<string, TeamMemberDto>
  memberList: TeamMemberDto[]
  criticalIds: Set<string>
  projectId: string
  canMove: (task: TaskDto) => boolean
  canAssign: boolean
  onMove: (taskId: string, status: TaskStatus) => void
  onAssign: (taskId: string, memberId: string | null) => void
  /** Present only on the first column, for managers: the "New item" row. */
  onQuickAdd?: (title: string) => Promise<void>
  onError: (message: string) => void
}

export function BoardColumn({ status, tasks, totalCount, limit, members, memberList, criticalIds, projectId, canMove, canAssign, onMove, onAssign, onQuickAdd, onError }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <Box
      ref={setNodeRef}
      component="section"
      aria-label={STATUS_LABEL[status]}
      sx={{
        minWidth: 0,
        bgcolor: isOver ? tokens.color.dropHover : tokens.color.surfaceSunken,
        // The column answers the drag immediately: it darkens and gains an outline the moment a card is over it.
        outline: isOver ? `2px solid ${tokens.color.primary}` : '2px solid transparent',
        outlineOffset: -2,
        transition: 'background-color 120ms ease-out, outline-color 120ms ease-out',
        borderRadius: `${tokens.radius.card}px`,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        minHeight: 140,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5, pb: 0.5 }}>
        <Typography component="h3" sx={{ fontWeight: 600 }}>
          {STATUS_LABEL[status]}
        </Typography>
        <WipCount count={totalCount} limit={limit} />
      </Box>
      {onQuickAdd && <NewItemInput onCreate={onQuickAdd} onError={onError} />}
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          assignee={task.assigneeId ? members.get(task.assigneeId) : undefined}
          members={memberList}
          critical={criticalIds.has(task.id)}
          to={`/p/${projectId}/tasks/${task.id}`}
          canMove={canMove(task)}
          canAssign={canAssign}
          onMove={(next) => onMove(task.id, next)}
          onAssign={(memberId) => onAssign(task.id, memberId)}
        />
      ))}
      {tasks.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, py: 1 }}>
          {totalCount > 0 ? 'No cards match the filter' : 'Nothing here'}
        </Typography>
      )}
    </Box>
  )
}
