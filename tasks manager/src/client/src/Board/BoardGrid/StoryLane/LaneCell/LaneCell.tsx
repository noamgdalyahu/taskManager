import Box from '@mui/material/Box'
import { useDroppable } from '@dnd-kit/core'
import type { TaskDto, TaskStatus, TeamMemberDto } from '@/api/types'
import { TaskCard } from '@/Board/BoardGrid/StoryLane/LaneCell/TaskCard/TaskCard'
import { tokens } from '@/theme/tokens'

interface LaneCellProps {
  laneKey: string
  status: TaskStatus
  tasks: TaskDto[]
  members: Map<string, TeamMemberDto>
  memberList: TeamMemberDto[]
  criticalIds: Set<string>
  projectId: string
  onMove: (taskId: string, status: TaskStatus) => void
  onAssign: (taskId: string, memberId: string | null) => void
}

/** One state of one lane. Every cell is its own drop target; dropping only ever changes the card's state. */
export function LaneCell({ laneKey, status, tasks, members, memberList, criticalIds, projectId, onMove, onAssign }: LaneCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `${laneKey}::${status}`, data: { status } })
  return (
    <Box
      ref={setNodeRef}
      sx={{
        // The cell is the whole drop target: it fills its grid column, so a card can be dropped anywhere in it, not only on the cards.
        minWidth: 0,
        minHeight: 64,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: isOver ? tokens.color.wash : tokens.color.cell,
        outline: isOver ? `1px dashed ${tokens.color.borderHover}` : 'none',
        outlineOffset: -4,
      }}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          assignee={task.assigneeId ? members.get(task.assigneeId) : undefined}
          members={memberList}
          critical={criticalIds.has(task.id)}
          to={`/p/${projectId}/tasks/${task.id}`}
          canMove
          canAssign
          onMove={(next) => onMove(task.id, next)}
          onAssign={(memberId) => onAssign(task.id, memberId)}
        />
      ))}
    </Box>
  )
}
