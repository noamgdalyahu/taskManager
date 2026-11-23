import Box from '@mui/material/Box'
import { useDraggable } from '@dnd-kit/core'
import type { TaskDto, TaskStatus, TeamMemberDto } from '@/api/types'
import { MoveMenu } from '@/Board/BoardGrid/StoryLane/LaneCell/TaskCard/MoveMenu/MoveMenu'
import { TaskCardView } from '@/Board/BoardGrid/StoryLane/LaneCell/TaskCard/TaskCardView/TaskCardView'
import { tokens } from '@/theme/tokens'

interface TaskCardProps {
  task: TaskDto
  assignee?: TeamMemberDto
  members: TeamMemberDto[]
  critical: boolean
  to: string
  canMove: boolean
  canAssign: boolean
  onMove: (status: TaskStatus) => void
  onAssign: (memberId: string | null) => void
}

/** A draggable card. While it is being dragged the original stays as a faint placeholder and a floating copy follows the pointer. */
export function TaskCard({ task, assignee, members, critical, to, canMove, canAssign, onMove, onAssign }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: !canMove })

  return (
    <Box
      ref={setNodeRef}
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      // The card contains a link and buttons, so it is a group, not a button (a button must not contain buttons).
      role="group"
      aria-label={task.title}
      sx={{
        opacity: isDragging ? 0.35 : 1,
        cursor: canMove ? 'grab' : 'default',
        borderRadius: `${tokens.radius.task}px`,
        touchAction: 'manipulation',
        '&:focus-visible': { outline: `2px solid ${tokens.color.primary}`, outlineOffset: 2 },
        '&:active': canMove ? { cursor: 'grabbing' } : undefined,
      }}
    >
      <TaskCardView
        task={task}
        assignee={assignee}
        critical={critical}
        to={to}
        members={members}
        canEditAssignee={canAssign}
        onAssign={onAssign}
        actions={canMove ? <MoveMenu taskTitle={task.title} current={task.status} onMove={onMove} /> : undefined}
      />
    </Box>
  )
}
