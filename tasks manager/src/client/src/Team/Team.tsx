import Box from '@mui/material/Box'
import { useProject, useTeam } from '@/api/projects'
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

  if (project.isLoading || team.isLoading) return <PageLoading />
  const error = project.error ?? team.error
  if (error) return <ErrorState error={error} />
  if (!project.data || !team.data) return null

  return (
    <>
      <PageHeader eyebrow={project.data.name} title="Team" subtitle={`${team.data.length} ${team.data.length === 1 ? 'member' : 'members'}`} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <MemberList projectId={projectId} ownerId={project.data.ownerId} currentUserId={me.id} members={team.data} />
        {isManager && <InvitePanel projectId={projectId} />}
      </Box>
    </>
  )
}
