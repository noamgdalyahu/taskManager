import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProject } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks, useTaskDetail } from '@/api/tasks'
import { useAuth } from '@/auth/useAuth'
import { EditTaskDialog } from '@/common/EditTaskDialog/EditTaskDialog'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { Surface } from '@/common/Surface/Surface'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { ActivityLog } from '@/TaskDetail/ActivityLog/ActivityLog'
import { CommentThread } from '@/TaskDetail/CommentThread/CommentThread'
import { TaskSummary } from '@/TaskDetail/TaskSummary/TaskSummary'
import { TimeLogList } from '@/TaskDetail/TimeLogList/TimeLogList'

export function TaskDetail() {
  const { projectId, taskId } = useProjectParams()
  const { isManager } = useAuth()
  const detail = useTaskDetail(taskId)
  const project = useProject(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const { members, byId } = useMemberDirectory(projectId)
  const [editing, setEditing] = useState(false)

  if (detail.isLoading) return <PageLoading />
  if (detail.error) return <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
  if (!detail.data) return null

  const { task, comments, history, timeLogs, loggedHours } = detail.data
  const sprint = sprints.data?.find((candidate) => candidate.id === task.sprintId)
  // Back goes to where the task lives: its sprint's board, or the backlog.
  const backTo = sprint ? `/p/${projectId}/board/${sprint.id}` : isManager ? `/p/${projectId}/work-items` : '/me/tasks'
  const allTasks = new Map((tasks.data ?? []).map((candidate) => [candidate.id, candidate]))

  return (
    <>
      <PageHeader
        eyebrow={
          <Box component={Link} to={backTo} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            <ArrowBackRounded sx={{ fontSize: 16 }} />
            {project.data?.name ?? 'Back'}
          </Box>
        }
        title={task.title}
        subtitle={<StatusChip status={task.status} />}
        actions={
          isManager ? (
            <HairlineButton onClick={() => setEditing(true)}>
              <EditOutlined aria-hidden />
              Edit
            </HairlineButton>
          ) : undefined
        }
      />
      {editing && <EditTaskDialog task={task} sprints={sprints.data ?? []} members={members} onClose={() => setEditing(false)} />}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <Box sx={{ flex: '999 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Surface>
            <Typography variant="h2" component="h2" sx={{ mb: 1 }}>
              Description
            </Typography>
            <Typography color={task.description ? 'text.primary' : 'text.secondary'} sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description.'}
            </Typography>
          </Surface>
          <CommentThread taskId={task.id} comments={comments} members={byId} />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TaskSummary
            task={task}
            members={members}
            allTasks={allTasks}
            sprintName={sprint?.name}
          />
          <TimeLogList logs={timeLogs} members={byId} loggedHours={loggedHours} estimateHours={task.estimateHours} />
          <ActivityLog history={history} members={byId} />
        </Box>
      </Box>
    </>
  )
}
