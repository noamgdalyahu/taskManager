import AddRounded from '@mui/icons-material/AddRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import type { SprintDto, TaskDto, TeamMemberDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { BacklogRow } from '@/ProjectOverview/Backlog/BacklogRow/BacklogRow'
import { NewTaskDialog } from '@/ProjectOverview/Backlog/NewTaskDialog/NewTaskDialog'

interface BacklogProps {
  projectId: string
  tasks: TaskDto[]
  sprints: SprintDto[]
  members: TeamMemberDto[]
}

export function Backlog({ projectId, tasks, sprints, members }: BacklogProps) {
  const [creating, setCreating] = useState(false)
  const sprintName = useMemo(() => new Map(sprints.map((sprint) => [sprint.id, sprint.name])), [sprints])
  const skillOptions = useMemo(() => [...new Set(members.flatMap((member) => Object.keys(member.skills)))].sort(), [members])

  // Free tasks first (they still need planning), then planned work, finished work last.
  const rank = (task: TaskDto) => (task.status === 'Done' ? 2 : task.sprintId === null ? 0 : 1)
  const ordered = [...tasks].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))
  const free = tasks.filter((task) => task.sprintId === null && task.status !== 'Done').length

  return (
    <Surface component="section" aria-labelledby="backlog-heading">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Box>
          <Typography id="backlog-heading" variant="h2" component="h2">
            Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}, {free} not in a sprint yet
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreating(true)}>
          New task
        </Button>
      </Box>
      {tasks.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          No tasks yet.
        </Typography>
      )}
      {ordered.map((task) => (
        <BacklogRow key={task.id} task={task} place={task.sprintId ? (sprintName.get(task.sprintId) ?? 'A sprint') : 'Backlog'} to={`/p/${projectId}/tasks/${task.id}`} />
      ))}
      {creating && <NewTaskDialog projectId={projectId} sprints={sprints} tasks={tasks} skillOptions={skillOptions} onClose={() => setCreating(false)} />}
    </Surface>
  )
}
