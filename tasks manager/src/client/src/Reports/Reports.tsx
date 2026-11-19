import Box from '@mui/material/Box'
import { useProject } from '@/api/projects'
import { useReports } from '@/api/insight'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useProjectParams } from '@/hooks/useProjectParams'
import { MemberAccuracy } from '@/Reports/MemberAccuracy/MemberAccuracy'
import { SprintHistory } from '@/Reports/SprintHistory/SprintHistory'
import { VelocityBars } from '@/Reports/VelocityBars/VelocityBars'

export function Reports() {
  const { projectId } = useProjectParams()
  const project = useProject(projectId)
  const reports = useReports(projectId)

  if (project.isLoading || reports.isLoading) return <PageLoading />
  const error = project.error ?? reports.error
  if (error) return <ErrorState error={error} onRetry={() => reports.refetch()} />
  if (!reports.data) return null

  return (
    <>
      <PageHeader eyebrow={project.data?.name} title="Reports" subtitle="How past sprints went, and how well estimates held up" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <VelocityBars sprints={reports.data.sprints} average={reports.data.averageVelocityHoursPerDay} />
        <MemberAccuracy members={reports.data.members} />
      </Box>
      <SprintHistory sprints={reports.data.sprints} />
    </>
  )
}
