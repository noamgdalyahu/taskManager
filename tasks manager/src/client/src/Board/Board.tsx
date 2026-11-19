import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBoard, useDashboard } from '@/api/insight'
import { useProject } from '@/api/projects'
import { useAssignTask, useChangeStatus, useCreateTask } from '@/api/tasks'
import { TASK_STATUSES, type TaskDto, type TaskStatus } from '@/api/types'
import { useAuth, useCurrentUser } from '@/auth/useAuth'
import { BoardColumn } from '@/Board/BoardColumn/BoardColumn'
import { TaskCardView } from '@/Board/BoardColumn/TaskCard/TaskCardView/TaskCardView'
import { BoardFilter } from '@/Board/BoardFilter/BoardFilter'
import { BoardSettingsDialog } from '@/Board/BoardSettingsDialog/BoardSettingsDialog'
import { MemberProgressStrip } from '@/Board/MemberProgressStrip/MemberProgressStrip'
import { matchesFilter, useBoardFilter } from '@/Board/useBoardFilter'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState, messageOf } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { SprintSwitcher } from '@/common/SprintSwitcher/SprintSwitcher'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { formatDay } from '@/lib/format'
import { sprintProgressLabel } from '@/lib/sprintDays'

// The floating card settles into place with an ease-out that approximates a critically damped spring (apple-design, section 4).
const DROP_ANIMATION = { duration: 260, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }

export function Board() {
  const { projectId, sprintId } = useProjectParams()
  const { isManager } = useAuth()
  const me = useCurrentUser()
  const navigate = useNavigate()

  const project = useProject(projectId)
  const { sprints, sprint, isLoading: sprintsLoading } = useSprintSelection(projectId, sprintId)
  const board = useBoard(sprint?.id)
  const { members, byId } = useMemberDirectory(projectId)
  // The dashboard is where the critical path comes from.
  const dashboard = useDashboard(sprint?.id)
  const changeStatus = useChangeStatus(sprint?.id)
  const assign = useAssignTask()
  const createTask = useCreateTask(projectId)
  const { filter, setFilter, activeCount } = useBoardFilter()

  const [dragging, setDragging] = useState<TaskDto | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Hysteresis before a drag begins (so a click still opens the task), and a press-and-hold on touch (so scrolling still scrolls).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const allTasks = useMemo(() => board.data?.columns.flatMap((column) => column.tasks) ?? [], [board.data])
  const criticalIds = useMemo(() => new Set(dashboard.data?.criticalPath ?? []), [dashboard.data])
  const allTags = useMemo(() => [...new Set(allTasks.flatMap((task) => task.requiredSkills))].sort(), [allTasks])

  if (sprintsLoading || project.isLoading) return <PageLoading />
  if (!sprint) {
    return (
      <EmptyState
        title="There is no sprint to show yet"
        description={isManager ? 'Create a sprint, choose its tasks and start it, then the board fills in.' : 'Your manager has not created a sprint for this project yet.'}
        action={
          isManager ? (
            <Button component={Link} to={`/p/${projectId}`} variant="contained">
              Go to the backlog
            </Button>
          ) : undefined
        }
      />
    )
  }

  // Every member of the project works the board: moving cards and changing assignees is not a manager-only job.
  const canMove = () => true
  const limits = project.data?.wipLimits ?? {}

  function move(taskId: string, status: TaskStatus) {
    changeStatus.mutate({ taskId, status }, { onError: (error) => setProblem(messageOf(error)) })
  }

  function reassign(taskId: string, memberId: string | null) {
    assign.mutate({ taskId, assigneeId: memberId }, { onError: (error) => setProblem(messageOf(error)) })
  }

  // Azure's "New item" asks only for a title. The estimate starts at one hour and is edited on the card's page.
  async function quickAdd(title: string) {
    await createTask.mutateAsync({ title, description: '', estimateHours: 1, deadline: null, requiredSkills: [], dependsOn: [], sprintId: sprint!.id })
  }

  function onDragStart(event: DragStartEvent) {
    setDragging(allTasks.find((task) => task.id === event.active.id) ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    const task = dragging
    setDragging(null)
    const target = event.over?.id as TaskStatus | undefined
    if (task && target && target !== task.status) move(task.id, target)
  }

  const goTo = (id: string) => navigate(`/p/${projectId}/board/${id}`)

  return (
    <>
      <PageHeader
        eyebrow={`${project.data?.name ?? ''} / Boards`}
        title={`${sprint.name} board`}
        subtitle={`${sprintProgressLabel(sprint.startDate, sprint.endDate)}, ends ${formatDay(sprint.endDate)}`}
        actions={
          <>
            <SprintSwitcher sprints={sprints} currentId={sprint.id} onSelect={goTo} />
            {isManager && (
              <IconButton aria-label="Board settings" onClick={() => setSettingsOpen(true)} sx={{ color: 'text.secondary' }}>
                <SettingsOutlined />
              </IconButton>
            )}
            <BoardFilter filter={filter} onChange={setFilter} activeCount={activeCount} members={members} tags={allTags} meId={me.id} />
          </>
        }
      />

      {board.error && <ErrorState error={board.error} onRetry={() => board.refetch()} />}
      {board.isLoading && <PageLoading />}

      {board.data && (
        <>
          <MemberProgressStrip tasks={allTasks} members={members} />
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
            <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', alignItems: 'start' }}>
              {TASK_STATUSES.map((status) => {
                const columnTasks = board.data.columns.find((column) => column.status === status)?.tasks ?? []
                return (
                  <BoardColumn
                    key={status}
                    status={status}
                    tasks={columnTasks.filter((task) => matchesFilter(task, filter))}
                    totalCount={columnTasks.length}
                    limit={limits[status]}
                    members={byId}
                    memberList={members}
                    criticalIds={criticalIds}
                    projectId={projectId}
                    canMove={canMove}
                    canAssign
                    onMove={move}
                    onAssign={reassign}
                    onQuickAdd={status === 'ToDo' ? quickAdd : undefined}
                    onError={setProblem}
                  />
                )
              })}
            </Box>
            <DragOverlay dropAnimation={DROP_ANIMATION}>
              {dragging && (
                <TaskCardView
                  lifted
                  task={dragging}
                  assignee={dragging.assigneeId ? byId.get(dragging.assigneeId) : undefined}
                  critical={criticalIds.has(dragging.id)}
                />
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {settingsOpen && <BoardSettingsDialog projectId={projectId} limits={limits} onClose={() => setSettingsOpen(false)} />}

      {/* A refused move is explained, and the card has already snapped back. */}
      <Snackbar open={!!problem} autoHideDuration={6000} onClose={() => setProblem(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => setProblem(null)}>
          {problem}
        </Alert>
      </Snackbar>
    </>
  )
}
