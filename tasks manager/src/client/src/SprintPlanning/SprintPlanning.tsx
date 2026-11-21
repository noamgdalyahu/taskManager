import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useAcceptPlan, usePlanJob, useStartPlan } from '@/api/planning'
import { useProject } from '@/api/projects'
import { useSprintTransition } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import type { SprintDto } from '@/api/types'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState, messageOf } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { SprintSwitcher } from '@/common/SprintSwitcher/SprintSwitcher'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { formatDay } from '@/lib/format'
import { SprintCapacity } from '@/SprintPlanning/SprintCapacity/SprintCapacity'
import { BacklogPicker } from '@/SprintPlanning/BacklogPicker/BacklogPicker'
import { DependencyChains } from '@/SprintPlanning/DependencyChains/DependencyChains'
import { PlanComparison } from '@/SprintPlanning/PlanComparison/PlanComparison'
import { PlanSummary } from '@/SprintPlanning/PlanSummary/PlanSummary'
import { PlanWarnings } from '@/SprintPlanning/PlanWarnings/PlanWarnings'
import { SuggestedPlan } from '@/SprintPlanning/SuggestedPlan/SuggestedPlan'
import { WorkloadAfterAssignment } from '@/SprintPlanning/WorkloadAfterAssignment/WorkloadAfterAssignment'

export function SprintPlanning() {
  const { projectId, sprintId } = useProjectParams()
  const project = useProject(projectId)
  const { sprints, sprint, isLoading, error } = useSprintSelection(projectId, sprintId)

  if (isLoading || project.isLoading) return <PageLoading />
  if (error) return <ErrorState error={error} />
  if (!sprint) {
    return (
      <EmptyState
        title="No sprints yet"
        description="Create a sprint on the Backlog page, then come back to plan it"
        action={
          <Button component={Link} to={`/p/${projectId}`} variant="contained">
            Go to the backlog
          </Button>
        }
      />
    )
  }

  // Keyed by sprint: switching sprints starts with a clean slate (no plan from the other sprint on screen).
  return (
    <>
      <PlanningBody key={sprint.id} projectId={projectId} projectName={project.data?.name ?? ''} sprint={sprint} sprints={sprints} />
    </>
  )
}

interface PlanningBodyProps {
  projectId: string
  projectName: string
  sprint: SprintDto
  sprints: SprintDto[]
}

function PlanningBody({ projectId, projectName, sprint, sprints }: PlanningBodyProps) {
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const tasks = useProjectTasks(projectId)
  const { members } = useMemberDirectory(projectId)
  const [jobId, setJobId] = useState<string>()
  const [notice, setNotice] = useState<string | null>(null)

  const start = useStartPlan(sprint.id)
  const job = usePlanJob(jobId)
  const accept = useAcceptPlan()
  const transition = useSprintTransition(projectId)

  const plan = job.data?.status === 'Done' ? job.data.result : null
  const running = start.isPending || job.data?.status === 'Queued' || job.data?.status === 'Running'
  const sprintTasks = tasks.data?.filter((task) => task.sprintId === sprint.id) ?? []
  // "N of M": everything this sprint could hold, i.e. what is already in it (finished work included) plus the free backlog.
  // Counting finished tasks on one side only is what once produced "14 of 10".
  const backlogCount = tasks.data?.filter((task) => task.sprintId === sprint.id || (task.sprintId === null && task.status !== 'Done')).length ?? 0

  async function suggest() {
    const created = await start.mutateAsync('Hungarian')
    setJobId(created.id)
  }

  async function acceptPlan() {
    if (!job.data) return
    await accept.mutateAsync(job.data.id)
    setNotice('Plan accepted. The suggested assignees are saved.')
  }

  async function startSprint(sprintId = sprint.id) {
    await transition.mutateAsync({ sprintId, to: 'start' })
    navigate(`/p/${projectId}/board/${sprintId}`)
  }

  const goTo = (id: string) => navigate(`/p/${projectId}/planning/${id}`)

  return (
    <>
      <PageHeader
        eyebrow={`${projectName} / Sprints`}
        title={`${sprint.name} planning`}
        subtitle={`${formatDay(sprint.startDate)} to ${formatDay(sprint.endDate)}, ${members.length} team members`}
        actions={
          <>
            <SprintSwitcher sprints={sprints} currentId={sprint.id} onSelect={goTo} />
            {isManager && sprint.status === 'Planned' && (
              <Button variant="outlined" startIcon={<PlayArrowRounded />} onClick={() => startSprint()} disabled={transition.isPending || sprint.taskCount === 0}>
                Start sprint
              </Button>
            )}
            {isManager && sprint.status === 'Planned' && (
              <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={suggest} disabled={running || sprint.taskCount === 0}>
                {running ? 'Planning…' : 'Suggest plan'}
              </Button>
            )}
          </>
        }
      />

      {(start.error || transition.error || accept.error) && <ErrorState error={start.error ?? transition.error ?? accept.error} />}

      <PlanSummary sprint={sprint} memberCount={members.length} backlogCount={backlogCount} plan={plan} />
      {plan && <PlanWarnings warnings={plan.warnings} />}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <BacklogPicker sprint={sprint} tasks={tasks.data ?? []} readOnly={!isManager} />
        <Box sx={{ flex: '999 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <SuggestedPlan job={job.data} starting={start.isPending} members={members} accepting={accept.isPending} planning={!isManager ? 'managers' : sprint.status === 'Planned' ? 'open' : 'started'} onAccept={acceptPlan} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
            <DependencyChains tasks={sprintTasks} plan={plan} />
            <WorkloadAfterAssignment plan={plan} members={members} sprint={sprint} />
          </Box>
          <PlanComparison sprintId={sprint.id} />
          <SprintCapacity sprints={sprints} current={sprint} tasks={tasks.data ?? []} members={members} canStart={isManager} starting={transition.isPending} onStart={(id) => void startSprint(id)} />
        </Box>
      </Box>

      <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
      {job.error && <Alert severity="error">{messageOf(job.error)}</Alert>}
    </>
  )
}
