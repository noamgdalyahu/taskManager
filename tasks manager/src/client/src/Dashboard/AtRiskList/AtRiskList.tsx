import Typography from '@mui/material/Typography'
import type { AtRiskTaskDto, TeamMemberDto } from '@/api/types'
import { AtRiskRow } from '@/Dashboard/AtRiskList/AtRiskRow/AtRiskRow'
import { Surface } from '@/common/Surface/Surface'

interface AtRiskListProps {
  tasks: AtRiskTaskDto[]
  members: Map<string, TeamMemberDto>
  projectId: string
}

export function AtRiskList({ tasks, members, projectId }: AtRiskListProps) {
  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 0.25 }}>
        At-risk tasks
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Tasks that are overdue, unassigned, or on the critical path and not started
      </Typography>
      {tasks.length === 0 ? (
        <Typography color="text.secondary" sx={{ pt: 2 }}>
          Nothing is at risk right now.
        </Typography>
      ) : (
        tasks.map((task) => <AtRiskRow key={task.taskId} task={task} assignee={task.assigneeId ? members.get(task.assigneeId) : undefined} to={`/p/${projectId}/tasks/${task.taskId}`} />)
      )}
    </Surface>
  )
}
