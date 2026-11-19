import UnfoldLessRounded from '@mui/icons-material/UnfoldLessRounded'
import UnfoldMoreRounded from '@mui/icons-material/UnfoldMoreRounded'
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { useProject } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks, useUpdateTask } from '@/api/tasks'
import { STATUS_LABEL, TASK_STATUSES, type TaskDto } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { ErrorState, messageOf } from '@/common/ErrorState/ErrorState'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { buildLanes } from '@/Board/boardLanes'
import { BacklogTree } from '@/SprintBacklog/BacklogTree/BacklogTree'
import type { BacklogColumn } from '@/SprintBacklog/BacklogTree/TreeRow/TreeRow'
import { NO_SPRINT, SprintTargets } from '@/SprintBacklog/SprintTargets/SprintTargets'
import { tokens } from '@/theme/tokens'

const COLUMN_LABEL: Record<BacklogColumn, string> = { state: 'State', assignee: 'Assignee', hours: 'Hours' }

/** The backlog: work items under their type with rollups, tasks outside any sprint first. Drag one onto a sprint to plan it. */
export function SprintBacklog() {
  const { projectId } = useProjectParams()
  const { isManager } = useAuth()
  const project = useProject(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const { byId } = useMemberDirectory(projectId)
  const update = useUpdateTask()

  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [parents, setParents] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [columns, setColumns] = useState<Set<BacklogColumn>>(() => new Set<BacklogColumn>(['state', 'assignee', 'hours']))
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [dragging, setDragging] = useState<TaskDto | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }), useSensor(KeyboardSensor))

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (tasks.data ?? [])
      .filter((task) => !needle || task.title.toLowerCase().includes(needle))
      .filter((task) => !state || task.status === state)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [tasks.data, search, state])

  if (project.isLoading || sprints.isLoading || tasks.isLoading) return <PageLoading />
  const error = project.error ?? sprints.error ?? tasks.error
  if (error) return <ErrorState error={error} onRetry={() => void tasks.refetch()} />

  const move = (task: TaskDto, sprintId: string | null) => {
    if (task.sprintId === sprintId) return
    update.mutate(
      {
        taskId: task.id,
        body: { title: task.title, description: task.description, estimateHours: task.estimateHours, deadline: task.deadline, requiredSkills: task.requiredSkills, dependsOn: task.dependsOn, sprintId, assigneeId: task.assigneeId, type: task.type ?? undefined },
      },
      { onError: (failure) => setProblem(messageOf(failure)) },
    )
  }

  const onDragStart = (event: DragStartEvent) => setDragging((tasks.data ?? []).find((task) => task.id === event.active.id) ?? null)
  const onDragEnd = (event: DragEndEvent) => {
    const task = dragging
    setDragging(null)
    if (!task || !event.over) return
    move(task, event.over.id === NO_SPRINT ? null : String(event.over.id))
  }

  // Every parent key currently on screen, so "Collapse all" and "Expand all" know what to act on.
  const groupKeys = ['free', 'planned'].flatMap((section) =>
    buildLanes(visible.filter((task) => (section === 'free' ? task.sprintId === null : task.sprintId !== null))).map((lane) => `${section}:${lane.key}`),
  )
  const allCollapsed = groupKeys.length > 0 && groupKeys.every((key) => collapsed.has(key))

  return (
    <>
      <PageHeader eyebrow={project.data?.name} title="Backlog" subtitle={`${visible.length} of ${tasks.data?.length ?? 0} work items`} />

      <Box role="search" aria-label="Filter the backlog" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <TextField size="small" type="search" placeholder="Search the backlog" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search the backlog' } }} sx={{ minWidth: 220, '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }} />
        <TextField select size="small" label="State" value={state} onChange={(event) => setState(event.target.value)} sx={{ minWidth: 130, '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }}>
          <MenuItem value="">All states</MenuItem>
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
        <HairlineButton onClick={() => setParents((value) => !value)} aria-pressed={parents} sx={parents ? { bgcolor: tokens.color.wash, borderColor: tokens.color.borderHover } : undefined}>
          <AccountTreeOutlined aria-hidden />
          Parents
        </HairlineButton>
        <HairlineButton onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groupKeys))} disabled={!parents || groupKeys.length === 0}>
          {allCollapsed ? <UnfoldMoreRounded aria-hidden /> : <UnfoldLessRounded aria-hidden />}
          {allCollapsed ? 'Expand all' : 'Collapse all'}
        </HairlineButton>
        <HairlineButton onClick={(event) => setAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={!!anchor} sx={{ ml: 'auto' }}>
          <ViewColumnOutlined aria-hidden />
          Column options
        </HairlineButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          {(Object.keys(COLUMN_LABEL) as BacklogColumn[]).map((column) => (
            <MenuItem
              key={column}
              onClick={() =>
                setColumns((current) => {
                  const next = new Set(current)
                  if (!next.delete(column)) next.add(column)
                  return next
                })
              }
            >
              <Checkbox size="small" checked={columns.has(column)} tabIndex={-1} disableRipple sx={{ p: 0.5, mr: 1 }} slotProps={{ input: { 'aria-label': COLUMN_LABEL[column] } }} />
              <ListItemText>{COLUMN_LABEL[column]}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start', '@media (min-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr) 320px' } }}>
          <BacklogTree
            tasks={visible}
            projectId={projectId}
            sprints={sprints.data ?? []}
            members={byId}
            parents={parents}
            collapsed={collapsed}
            onToggle={(key) =>
              setCollapsed((current) => {
                const next = new Set(current)
                if (!next.delete(key)) next.add(key)
                return next
              })
            }
            columns={columns}
            canMove={isManager}
            onMove={move}
          />
          <SprintTargets sprints={sprints.data ?? []} canDrop={isManager} />
        </Box>
        <DragOverlay>
          {dragging && (
            <Box sx={{ px: 1.5, py: 1, bgcolor: tokens.color.card, border: `1px solid ${tokens.color.borderHover}`, borderRadius: `${tokens.radius.task}px`, boxShadow: tokens.color.shadow, fontSize: '0.8125rem', fontWeight: 500, maxWidth: 320 }}>
              {dragging.title}
            </Box>
          )}
        </DragOverlay>
      </DndContext>

      <Snackbar open={!!problem} autoHideDuration={6000} onClose={() => setProblem(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => setProblem(null)}>
          {problem}
        </Alert>
      </Snackbar>
    </>
  )
}
