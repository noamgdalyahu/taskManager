import { useProject } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useProjectParams } from '@/hooks/useProjectParams'
import { Backlog } from '@/ProjectOverview/Backlog/Backlog'
import { SprintList } from '@/ProjectOverview/SprintList/SprintList'

/** The project's home for a manager: its sprints on top, its backlog below. */
export function ProjectOverview() {
  const { projectId } = useProjectParams()
  const project = useProject(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)

  if (project.isLoading || sprints.isLoading || tasks.isLoading) return <PageLoading />
  const error = project.error ?? sprints.error ?? tasks.error
  if (error) return <ErrorState error={error} onRetry={() => { void project.refetch(); void sprints.refetch(); void tasks.refetch() }} />

  return (
    <>
      <PageHeader eyebrow="Project" title={project.data?.name ?? ''} subtitle={project.data?.description || undefined} />
      <SprintList projectId={projectId} sprints={sprints.data ?? []} />
      <Backlog projectId={projectId} tasks={tasks.data ?? []} sprints={sprints.data ?? []} />
    </>
  )
}
