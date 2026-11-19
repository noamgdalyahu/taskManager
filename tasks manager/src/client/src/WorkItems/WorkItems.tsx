import AddRounded from '@mui/icons-material/AddRounded'
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProject } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import { STATUS_LABEL, TASK_STATUSES, TASK_TYPES, TASK_TYPE_LABEL, type TaskDto } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { NewTaskDialog } from '@/common/NewTaskDialog/NewTaskDialog'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { StatusChip } from '@/common/StatusChip/StatusChip'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useProjectParams } from '@/hooks/useProjectParams'
import { formatHours, remainingHours, shortId } from '@/lib/format'
import { tokens } from '@/theme/tokens'

type ColumnKey = 'id' | 'title' | 'type' | 'state' | 'assignee' | 'sprint' | 'remaining'

const COLUMNS: { key: ColumnKey; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'state', label: 'State' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'remaining', label: 'Remaining', align: 'right' },
]

const ALL = ''
const NONE = 'none'

/** Every work item of the project in one table: search, filter, sort, and choose the columns. A row opens the item. */
export function WorkItems() {
  const { projectId } = useProjectParams()
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const project = useProject(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const { members, byId } = useMemberDirectory(projectId)

  const [search, setSearch] = useState('')
  const [state, setState] = useState(ALL)
  const [assignee, setAssignee] = useState(ALL)
  const [type, setType] = useState(ALL)
  const [sprint, setSprint] = useState(ALL)
  const [sort, setSort] = useState<{ key: ColumnKey; dir: 'asc' | 'desc' }>({ key: 'id', dir: 'asc' })
  const [shown, setShown] = useState<Set<ColumnKey>>(() => new Set(COLUMNS.map((column) => column.key)))
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null)
  const [creating, setCreating] = useState(false)

  const sprintName = useMemo(() => new Map((sprints.data ?? []).map((candidate) => [candidate.id, candidate.name])), [sprints.data])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const sortValue = (task: TaskDto): string | number => {
      switch (sort.key) {
        case 'id':
          return shortId(task.id)
        case 'title':
          return task.title.toLowerCase()
        case 'type':
          return task.type ? TASK_TYPE_LABEL[task.type] : ''
        case 'state':
          return TASK_STATUSES.indexOf(task.status)
        case 'assignee':
          return (task.assigneeId && byId.get(task.assigneeId)?.name.toLowerCase()) || '￿'
        case 'sprint':
          return (task.sprintId && sprintName.get(task.sprintId)?.toLowerCase()) || '￿'
        case 'remaining':
          return remainingHours(task)
      }
    }
    return (tasks.data ?? [])
      .filter((task) => !needle || `${task.title} ${shortId(task.id)}`.toLowerCase().includes(needle))
      .filter((task) => state === ALL || task.status === state)
      .filter((task) => assignee === ALL || (assignee === NONE ? task.assigneeId === null : task.assigneeId === assignee))
      .filter((task) => type === ALL || (type === NONE ? task.type === null : task.type === type))
      .filter((task) => sprint === ALL || (sprint === NONE ? task.sprintId === null : task.sprintId === sprint))
      .sort((a, b) => {
        const [x, y] = [sortValue(a), sortValue(b)]
        const order = x < y ? -1 : x > y ? 1 : 0
        return sort.dir === 'asc' ? order : -order
      })
  }, [tasks.data, search, state, assignee, type, sprint, sort, byId, sprintName])

  if (project.isLoading || tasks.isLoading || sprints.isLoading) return <PageLoading />
  const error = project.error ?? tasks.error ?? sprints.error
  if (error) return <ErrorState error={error} onRetry={() => void tasks.refetch()} />

  const visibleColumns = COLUMNS.filter((column) => shown.has(column.key))
  const total = tasks.data?.length ?? 0
  const filterSx = { minWidth: 130, '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }

  return (
    <>
      <PageHeader
        eyebrow={project.data?.name}
        title="Work items"
        subtitle={`${rows.length} of ${total} work items`}
        actions={
          isManager ? (
            <HairlineButton primary onClick={() => setCreating(true)}>
              <AddRounded aria-hidden />
              New work item
            </HairlineButton>
          ) : undefined
        }
      />

      <Box role="search" aria-label="Filter work items" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <TextField size="small" type="search" placeholder="Search by title or ID" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search work items' } }} sx={{ ...filterSx, minWidth: 220 }} />
        <TextField select size="small" label="State" value={state} onChange={(event) => setState(event.target.value)} sx={filterSx}>
          <MenuItem value={ALL}>All states</MenuItem>
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)} sx={filterSx}>
          <MenuItem value={ALL}>Anyone</MenuItem>
          <MenuItem value={NONE}>Unassigned</MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} value={member.id}>
              {member.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Type" value={type} onChange={(event) => setType(event.target.value)} sx={filterSx}>
          <MenuItem value={ALL}>All types</MenuItem>
          <MenuItem value={NONE}>No type</MenuItem>
          {TASK_TYPES.map((option) => (
            <MenuItem key={option} value={option}>
              {TASK_TYPE_LABEL[option]}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Sprint" value={sprint} onChange={(event) => setSprint(event.target.value)} sx={filterSx}>
          <MenuItem value={ALL}>All sprints</MenuItem>
          <MenuItem value={NONE}>Backlog (no sprint)</MenuItem>
          {(sprints.data ?? []).map((candidate) => (
            <MenuItem key={candidate.id} value={candidate.id}>
              {candidate.name}
            </MenuItem>
          ))}
        </TextField>
        <HairlineButton onClick={(event) => setPickerAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={!!pickerAnchor} sx={{ ml: 'auto' }}>
          <ViewColumnOutlined aria-hidden />
          Columns
        </HairlineButton>
        <Menu anchorEl={pickerAnchor} open={!!pickerAnchor} onClose={() => setPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          {COLUMNS.map((column) => (
            <MenuItem
              key={column.key}
              disabled={column.key === 'title'}
              onClick={() =>
                setShown((current) => {
                  const next = new Set(current)
                  if (!next.delete(column.key)) next.add(column.key)
                  return next
                })
              }
            >
              <Checkbox size="small" checked={shown.has(column.key)} tabIndex={-1} disableRipple sx={{ p: 0.5, mr: 1 }} slotProps={{ input: { 'aria-label': column.label } }} />
              <ListItemText>{column.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <TableContainer sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface }}>
        <Table size="small" aria-label="Work items" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell key={column.key} align={column.align} sortDirection={sort.key === column.key ? sort.dir : false} sx={{ color: tokens.color.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <TableSortLabel active={sort.key === column.key} direction={sort.key === column.key ? sort.dir : 'asc'} onClick={() => setSort((current) => ({ key: column.key, dir: current.key === column.key && current.dir === 'asc' ? 'desc' : 'asc' }))}>
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} sx={{ py: 5, textAlign: 'center', color: tokens.color.faint }}>
                  {total === 0 ? 'This project has no work items yet.' : 'No work items match these filters.'}
                </TableCell>
              </TableRow>
            )}
            {rows.map((task) => {
              const person = task.assigneeId ? byId.get(task.assigneeId) : undefined
              const cells: Record<ColumnKey, React.ReactNode> = {
                id: (
                  <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.faint }}>
                    #{shortId(task.id)}
                  </Box>
                ),
                title: (
                  <Box component={Link} to={`/p/${projectId}/tasks/${task.id}`} dir="ltr" sx={{ color: tokens.color.text, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {task.title}
                  </Box>
                ),
                type: <TypeChip type={task.type} />,
                state: <StatusChip status={task.status} />,
                assignee: person ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <MemberAvatar id={person.id} name={person.name} size={20} />
                    {person.name.split(/\s+/)[0]}
                  </Box>
                ) : (
                  <Box component="span" sx={{ color: tokens.color.faint }}>
                    Unassigned
                  </Box>
                ),
                sprint: task.sprintId ? (sprintName.get(task.sprintId) ?? 'A sprint') : <Box component="span" sx={{ color: tokens.color.faint }}>Backlog</Box>,
                remaining: (
                  <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                    {formatHours(remainingHours(task))}
                  </Box>
                ),
              }
              return (
                <TableRow key={task.id} hover onClick={() => navigate(`/p/${projectId}/tasks/${task.id}`)} sx={{ cursor: 'pointer' }}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.key} align={column.align} sx={{ whiteSpace: column.key === 'title' ? 'normal' : 'nowrap' }}>
                      {cells[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {creating && <NewTaskDialog projectId={projectId} sprints={sprints.data ?? []} tasks={tasks.data ?? []} onClose={() => setCreating(false)} />}
    </>
  )
}
