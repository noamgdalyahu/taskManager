import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Link, useNavigate } from 'react-router-dom'
import { useBoard, useDashboard } from '@/api/insight'
import { useProject } from '@/api/projects'
import { TASK_STATUSES, type TaskStatus } from '@/api/types'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { SprintSwitcher } from '@/common/SprintSwitcher/SprintSwitcher'
import { AtRiskList } from '@/Dashboard/AtRiskList/AtRiskList'
import { StatusPie } from '@/Dashboard/StatusPie/StatusPie'
import { KpiRow } from '@/Dashboard/KpiRow/KpiRow'
import { WorkloadPanel } from '@/Dashboard/WorkloadPanel/WorkloadPanel'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { sprintProgressLabel } from '@/lib/sprintDays'

export function Dashboard() {
  const { projectId, sprintId } = useProjectParams()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const { sprints, sprint, isLoading } = useSprintSelection(projectId, sprintId)
  const dashboard = useDashboard(sprint?.id)
  const board = useBoard(sprint?.id)
  const { byId } = useMemberDirectory(projectId)

  if (isLoading || project.isLoading) return <PageLoading />
  if (!sprint) {
    return (
      <EmptyState
        title="No sprint to report on yet"
        description="The dashboard fills in once a sprint exists and has tasks."
        action={
          <Button component={Link} to={`/p/${projectId}`} variant="contained">
            Go to the backlog
          </Button>
        }
      />
    )
  }

  const data = dashboard.data
  const statusCounts = Object.fromEntries(TASK_STATUSES.map((status) => [status, board.data?.columns.find((column) => column.status === status)?.tasks.length ?? 0])) as Record<TaskStatus, number>

  return (
    <>
      <PageHeader
        eyebrow={`${project.data?.name ?? ''} / ${sprint.name}`}
        title="Manager dashboard"
        subtitle={sprintProgressLabel(sprint.startDate, sprint.endDate)}
        actions={
          <SprintSwitcher sprints={sprints} currentId={sprint.id} onSelect={(id) => navigate(`/p/${projectId}/dashboard/${id}`)} />
        }
      />

      {dashboard.isLoading && <PageLoading />}
      {dashboard.error && <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />}

      {data && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <KpiRow dashboard={data} sprint={sprint} inQa={board.data?.columns.find((column) => column.status === 'InQA')?.tasks ?? []} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
            {/* The tasks that need attention on the left; the status split and workload beside them. */}
            <Box sx={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <AtRiskList tasks={data.atRisk} members={byId} projectId={projectId} />
            </Box>
            <Box sx={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <StatusPie counts={statusCounts} />
              <WorkloadPanel
                title="Workload (planned vs capacity)"
                rows={data.workload.map((w) => ({ memberId: w.memberId, name: w.name, value: w.assignedHours, total: w.capacityHours }))}
              />
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}
