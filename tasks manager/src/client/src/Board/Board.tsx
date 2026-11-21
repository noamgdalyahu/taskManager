import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBoard, useDashboard } from '@/api/insight'
import { useProject } from '@/api/projects'
import { useAssignTask, useChangeStatus, useProjectTasks } from '@/api/tasks'
import { TASK_STATUSES, type TaskDto, type TaskStatus, type TaskType } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { BoardGrid } from '@/Board/BoardGrid/BoardGrid'
import { TaskCardView } from '@/Board/BoardGrid/StoryLane/LaneCell/TaskCard/TaskCardView/TaskCardView'
import { BoardHeader } from '@/Board/BoardHeader/BoardHeader'
import { BoardSettingsDialog } from '@/Board/BoardSettingsDialog/BoardSettingsDialog'
import { BoardTabs } from '@/Board/BoardTabs/BoardTabs'
import { buildLanes, sumHours, type LaneGrouping } from '@/Board/boardLanes'
import { SidePanel } from '@/Board/SidePanel/SidePanel'
import { StatStrip } from '@/Board/StatStrip/StatStrip'
import { matchesFilter, useBoardFilter } from '@/Board/useBoardFilter'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState, messageOf } from '@/common/ErrorState/ErrorState'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { NewTaskDialog } from '@/common/NewTaskDialog/NewTaskDialog'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { useSprintSelection } from '@/hooks/useSprintSelection'
import { daysBetween, todayIso } from '@/lib/sprintDays'

// The floating card settles into place with an ease-out that approximates a critically damped spring.
const DROP_ANIMATION = { duration: 260, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }

export function Board() {
  const { projectId, sprintId } = useProjectParams()
  const { isManager } = useAuth()
  const navigate = useNavigate()

  const project = useProject(projectId)
  const { sprints, sprint, isLoading: sprintsLoading } = useSprintSelection(projectId, sprintId)
  const board = useBoard(sprint?.id)
  const { members, byId } = useMemberDirectory(projectId)
  // The dashboard is where the critical path comes from.
  const dashboard = useDashboard(sprint?.id)
  const changeStatus = useChangeStatus(sprint?.id)
  const assign = useAssignTask()
  const projectTasks = useProjectTasks(projectId)
  const { filter, setFilter } = useBoardFilter()

  const [dragging, setDragging] = useState<TaskDto | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [fullscreen, setFullscreen] = useState(false)
  // How the lanes are formed. Remembered in this browser, so the board opens the way it was left.
  const [grouping, setGroupingState] = useState<LaneGrouping>(() => {
    try {
      const saved = localStorage.getItem('sm.board.grouping')
      // With nothing chosen yet the board opens ungrouped; a saved choice wins.
      return saved === 'type' || saved === 'assignee' || saved === 'none' ? saved : 'none'
    } catch {
      return 'none'
    }
  })
  const setGrouping = (next: LaneGrouping) => {
    setGroupingState(next)
    setCollapsed(new Set())
    try {
      localStorage.setItem('sm.board.grouping', next)
    } catch {
      // not remembered; still applied
    }
  }

  // Esc leaves full screen; Ctrl+N starts a new task (where the browser lets a page have the shortcut).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setCreating(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Hysteresis before a drag begins (so a click still opens the task), and a press-and-hold on touch (so scrolling still scrolls).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const allTasks = useMemo(() => board.data?.columns.flatMap((column) => column.tasks) ?? [], [board.data])
  const criticalIds = useMemo(() => new Set(dashboard.data?.criticalPath ?? []), [dashboard.data])

  const visible = useMemo(() => allTasks.filter((task) => matchesFilter(task, filter)), [allTasks, filter])
  const lanes = useMemo(() => buildLanes(visible, grouping, (id) => byId.get(id)?.name ?? 'Unknown'), [visible, grouping, byId])
  const totals = useMemo(() => Object.fromEntries(TASK_STATUSES.map((status) => [status, allTasks.filter((task) => task.status === status).length])) as Record<TaskStatus, number>, [allTasks])

  if (sprintsLoading || project.isLoading) return <PageLoading shape="board" />
  if (!sprint) {
    return (
      <EmptyState
        title="There is no sprint to show yet"
        description={isManager ? 'Create a sprint, choose its tasks and start it, then the board fills in' : 'Your manager has not created a sprint for this project yet'}
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

  const limits = project.data?.wipLimits ?? {}

  function move(taskId: string, status: TaskStatus) {
    changeStatus.mutate({ taskId, status }, { onError: (error) => setProblem(messageOf(error)) })
  }

  function reassign(taskId: string, memberId: string | null) {
    assign.mutate({ taskId, assigneeId: memberId }, { onError: (error) => setProblem(messageOf(error)) })
  }

  function onDragStart(event: DragStartEvent) {
    setDragging(allTasks.find((task) => task.id === event.active.id) ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    const task = dragging
    setDragging(null)
    const target = event.over?.data.current?.status as TaskStatus | undefined
    if (task && target && target !== task.status) move(task.id, target)
  }

  const goTo = (id: string) => navigate(`/p/${projectId}/board/${id}`)

  const toggleLane = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const toggleAll = () => setCollapsed(lanes.length > 0 && lanes.every((lane) => collapsed.has(lane.key)) ? new Set() : new Set(lanes.map((lane) => lane.key)))
  const togglePerson = (memberId: string) =>
    setFilter({ ...filter, assignees: filter.assignees.includes(memberId) ? filter.assignees.filter((id) => id !== memberId) : [...filter.assignees, memberId] })
  const toggleType = (type: TaskType) => setFilter({ ...filter, types: filter.types.includes(type) ? filter.types.filter((other) => other !== type) : [...filter.types, type] })

  // The numbers follow the filters; the sprint day is the sprint's own.
  const doneHours = sumHours(visible.filter((task) => task.status === 'Done'))
  const days = daysBetween(sprint.startDate, sprint.endDate) + 1
  const day = Math.min(days, Math.max(0, daysBetween(sprint.startDate, todayIso()) + 1))

  return (
    <>
      <BoardHeader
        sprint={sprint}
        sprints={sprints}
        onSelectSprint={goTo}
        onNewItem={() => setCreating(true)}
      />
      <BoardTabs />

      {board.error && <ErrorState error={board.error} onRetry={() => board.refetch()} />}
      {board.isLoading && <PageLoading shape="board" header={false} />}

      {board.data && (
        <>
          <StatStrip workItems={visible.length} remainingHours={sumHours(visible) - doneHours} completedHours={doneHours} day={day} days={days} />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'minmax(0, 1fr)',
              alignItems: 'start',
              // Two columns once the board has room for its 560px minimum beside the side panel; below that the panel drops under the board.
              '@media (min-width: 1180px)': { gridTemplateColumns: 'minmax(560px, 1fr) clamp(320px, 26vw, 400px)' },
            }}
          >
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
              <BoardGrid
                lanes={lanes}
                visible={visible}
                limits={limits}
                totals={totals}
                collapsed={collapsed}
                onToggleLane={toggleLane}
                onToggleAll={toggleAll}
                grouping={grouping}
                onGrouping={setGrouping}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((value) => !value)}
                onAddTask={() => setCreating(true)}
                toolbarExtra={
                  isManager ? (
                    <HairlineButton onClick={() => setSettingsOpen(true)} aria-label="Board settings" title="Board settings" sx={{ width: 32, px: 0 }}>
                      <SettingsOutlined aria-hidden />
                    </HairlineButton>
                  ) : undefined
                }
                members={byId}
                memberList={members}
                criticalIds={criticalIds}
                projectId={projectId}
                onMove={move}
                onAssign={reassign}
              />
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
            <SidePanel
              projectId={projectId}
              projectName={project.data?.name ?? ''}
              sprint={sprint}
              sprints={sprints}
              allTasks={allTasks}
              members={members}
              filter={filter}
              onFilter={setFilter}
              onTogglePerson={togglePerson}
              onToggleType={toggleType}
            />
          </Box>
        </>
      )}

      {creating && <NewTaskDialog projectId={projectId} sprints={sprints} tasks={projectTasks.data ?? []} defaultSprintId={sprint.id} onClose={() => setCreating(false)} />}

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
