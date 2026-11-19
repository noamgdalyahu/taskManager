import Box from '@mui/material/Box'
import { useProject, useTeam } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import { useAuth } from '@/auth/useAuth'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useProjectParams } from '@/hooks/useProjectParams'
import { DangerZone } from '@/ProjectSettings/DangerZone/DangerZone'
import { GeneralSettings } from '@/ProjectSettings/GeneralSettings/GeneralSettings'
import { SprintSettings } from '@/ProjectSettings/SprintSettings/SprintSettings'
import { TeamSettings } from '@/ProjectSettings/TeamSettings/TeamSettings'
import { TypeSettings } from '@/ProjectSettings/TypeSettings/TypeSettings'

/** Project settings: General, Sprints, Types, Team and roles, and the Danger zone. Managers edit; everyone else reads. */
export function ProjectSettings() {
  const { projectId } = useProjectParams()
  const { isManager } = useAuth()
  const project = useProject(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const team = useTeam(projectId)

  if (project.isLoading || sprints.isLoading || tasks.isLoading || team.isLoading) return <PageLoading />
  const error = project.error ?? sprints.error ?? tasks.error ?? team.error
  if (error) return <ErrorState error={error} />
  if (!project.data) return null

  return (
    <>
      <PageHeader eyebrow={project.data.name} title="Project settings" subtitle={isManager ? undefined : 'You can read these settings; a manager can change them.'} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 860 }}>
        {/* Keyed by project: switching project starts every form from that project's values. */}
        <GeneralSettings key={project.data.id} project={project.data} canEdit={isManager} />
        <SprintSettings sprints={sprints.data ?? []} projectId={projectId} canEdit={isManager} />
        <TypeSettings tasks={tasks.data ?? []} />
        <TeamSettings members={team.data ?? []} ownerId={project.data.ownerId} projectId={projectId} />
        <DangerZone project={project.data} canEdit={isManager} />
      </Box>
    </>
  )
}
