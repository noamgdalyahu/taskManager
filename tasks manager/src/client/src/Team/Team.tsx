import Box from '@mui/material/Box'
import { useProject, useTeam } from '@/api/projects'
import { useProjectTasks } from '@/api/tasks'
import { memberCapacityHours } from '@/hooks/useCapacity'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { useAuth, useCurrentUser } from '@/auth/useAuth'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useProjectParams } from '@/hooks/useProjectParams'
import { InvitePanel } from '@/Team/InvitePanel/InvitePanel'
import { MemberList } from '@/Team/MemberList/MemberList'

export function Team() {
  const { projectId } = useProjectParams()
  const me = useCurrentUser()
  const { isManager } = useAuth()
  const project = useProject(projectId)
  const team = useTeam(projectId)
  const tasks = useProjectTasks(projectId)
  const { sprint } = useSprintSelection(projectId, undefined)

  if (project.isLoading || team.isLoading || tasks.isLoading) return <PageLoading shape="detail" />
  const error = project.error ?? team.error ?? tasks.error
  if (error) return <ErrorState error={error} />
  if (!project.data || !team.data) return null

  // Each member's share of the sprint on screen: their tasks, those tasks' hours, and what they can do in the sprint.
  const stats = new Map(
    team.data.map((member) => {
      const mine = (tasks.data ?? []).filter((task) => sprint && task.sprintId === sprint.id && task.assigneeId === member.id)
      return [member.id, { tasks: mine.length, hours: mine.reduce((sum, task) => sum + task.estimateHours, 0), capacity: sprint ? memberCapacityHours(member, sprint) : 0, sprintName: sprint?.name }]
    }),
  )

  return (
    <>
      <PageHeader eyebrow={project.data.name} title="Team" subtitle={`${team.data.length} ${team.data.length === 1 ? 'member' : 'members'}`} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <MemberList projectId={projectId} ownerId={project.data.ownerId} currentUserId={me.id} members={team.data} stats={stats} />
        {isManager && <InvitePanel projectId={projectId} />}
      </Box>
    </>
  )
}
